import { error, json } from '@sveltejs/kit';
import fetch from 'node-fetch';
import type { RequestHandler } from './$types';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import * as fs from 'fs';

export const POST: RequestHandler = async ({ request: req, fetch: webFetch }) => {
    const { studentid, password } = await req.json();
    const worker = await Tesseract.createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    await worker.setParameters({
        tessedit_char_whitelist: '0123456789'
    });
    const ocrAndLogin: (_try?:number) => Promise<Response> = async (_try = 0) => {
        if(_try == 3) {
            throw error(500, "Internal Server Error");
        }
        let tries = 0, pwdstr = "", answer = "";
        do {
            tries++;
            const url = 'http://www.ccxp.nthu.edu.tw/ccxp/INQUIRE';
            const res = await fetch(url);
            const body = await res.text();
            if(!body) {
                continue;
            }
            const bodyMatch = body.match(/auth_img\.php\?pwdstr=([a-zA-Z0-9_-]+)/);
            if(!bodyMatch) {
                continue;
            }
            pwdstr = bodyMatch[1];
            console.log(pwdstr);
            //fetch the image from the url and send as base64
            const imgResponse = await fetch('http://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/auth_img.php?pwdstr=' + pwdstr);
            const imgBuffer = await sharp(await imgResponse.buffer())
                                        .resize(320,120)
                                        .greyscale() // make it greyscale
                                        .linear(1.2, 0) // increase the contrast
                                        .toBuffer()

            //save buff to file
            fs.writeFile('test.png', imgBuffer, (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
            });

            // using Tesseract and whitelist numbers only
            const { data: { text } } = await worker.recognize(imgBuffer);

            console.log("tesseract:", text)
            answer = text.replace(/[^0-9]/g, "") || "";
            

            // const { data: { text } } = await Tesseract.recognize(
            //     imgBuffer,
            //     'eng',
            //     { logger: m => console.log(m)}
            // )

            // Creates a client
            // const client = new vision.ImageAnnotatorClient({
            //     projectId: 'chews-playground',
            //     keyFilename: 'chews-playground-d32dab919d7c.json'
            // });

            // // Performs text detection on the local file
            // const [result] = await client.textDetection(imgBuffer);
            // const detections = result.textAnnotations;
            // if(!detections || detections?.length == 0) {
            //     continue;
            // }
            // const detected = detections[0];
            // answer = detected?.description?.replace(/[^0-9]/g, "") || "";
            console.log("Answer: ",answer)
            if(answer.length == 6) break;
        } while (tries <= 5);
        if(tries == 6 || answer.length != 6) {
            throw error(500, "Internal Server Error");
        }
        const response = await fetch("https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/pre_select_entry.php", {
            "headers": {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "max-age=0",
                "content-type": "application/x-www-form-urlencoded",
                "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Microsoft Edge\";v=\"110\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "same-origin",
                "upgrade-insecure-requests": "1",
                "cookie": "TS01860c62=01dba9d2283c80dfc9c2e63410d8f99f7eb373994552ce9bfb51853db6546fcd200f80d8b73c0239df883c58bcf7477f86cb9ae228",
                "Referer": "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": `account=${studentid}&passwd=${password}&passwd2=${answer}&Submit=%B5n%A4J&fnstr=${pwdstr}`,
            "method": "POST"
        });
        const resHTML = await response.arrayBuffer()
                            .then(buffer => {
                                const decoder = new TextDecoder("big5")
                                const text = decoder.decode(buffer)
                                return text
                            })
        
        console.log(resHTML);
        if(resHTML.match('驗證碼輸入錯誤!')) {
            return await ocrAndLogin(_try++);
        }
        if(resHTML.match('帳號或密碼錯誤')) {
            throw error(401, "Unauthorized");
        }
        else if(resHTML.match("/ccxp/INQUIRE/index.php")) {
            throw error(429, "Too Many Requests "+ resHTML);
        }
        if(resHTML.match(/ACIXSTORE=([a-zA-Z0-9_-]+)/)?.length == 0) {
            return await ocrAndLogin(_try++);
        }
        else {
            const ACIXSTORE = resHTML.match(/ACIXSTORE=([a-zA-Z0-9_-]+)/)?.[1];
            if(!ACIXSTORE) {
                return await ocrAndLogin(_try++);
            }
            await webFetch(`https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php?ACIXSTORE=${ACIXSTORE}&hint=${studentid}`, {
                "headers": {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                    "accept-language": "en-US,en;q=0.9",
                    "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Microsoft Edge\";v=\"110\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "document",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-site": "same-origin",
                    "sec-fetch-user": "?1",
                    "upgrade-insecure-requests": "1"
                },
                "referrer": `https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php?ACIXSTORE=${ACIXSTORE}&hint=${studentid}`,
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors",
                "credentials": "include"
            });
            await webFetch(`https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/top.php?account=${studentid}&ACIXSTORE==${ACIXSTORE}`, {
                "headers": {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                    "accept-language": "en-US,en;q=0.9",
                    "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Microsoft Edge\";v=\"110\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "frame",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-site": "same-origin",
                    "upgrade-insecure-requests": "1"
                },
                "referrer": `https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php?ACIXSTORE=${ACIXSTORE}&hint=${studentid}`,
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors",
                "credentials": "include"
            });
            await webFetch(`https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/IN_INQ_STU.php?ACIXSTORE=${ACIXSTORE}`, {
                "headers": {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                    "accept-language": "en-US,en;q=0.9",
                    "cache-control": "max-age=0",
                    "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Microsoft Edge\";v=\"110\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "frame",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-site": "same-origin",
                    "upgrade-insecure-requests": "1",
                    "Referer": `https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php?ACIXSTORE=${ACIXSTORE}&hint=${studentid}`,
                    "Referrer-Policy": "strict-origin-when-cross-origin"
                },
                "body": null,
                "method": "GET"
            });
            await webFetch(`https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/xp03_m.htm?ACIXSTORE=${ACIXSTORE}`, {
                "headers": {
                  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                  "accept-language": "en-US,en;q=0.9",
                  "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Microsoft Edge\";v=\"110\"",
                  "sec-ch-ua-mobile": "?0",
                  "sec-ch-ua-platform": "\"Windows\"",
                  "sec-fetch-dest": "frame",
                  "sec-fetch-mode": "navigate",
                  "sec-fetch-site": "same-origin",
                  "upgrade-insecure-requests": "1"
                },
                "referrer": `https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php?ACIXSTORE=${ACIXSTORE}&hint=${studentid}`,
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors",
                "credentials": "include"
              });
            return json({resHTML: resHTML, ACIXSTORE: ACIXSTORE});
        }
    }
    const result = await ocrAndLogin();
    await worker.terminate();

    return result;
}
