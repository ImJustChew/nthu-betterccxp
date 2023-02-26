import { error, json } from '@sveltejs/kit';
import fetch from 'node-fetch';
import type { RequestHandler } from './$types';
import Tesseract from 'tesseract.js';

export const POST: RequestHandler = async ({ request: req }) => {
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
            const imgBuffer = await imgResponse.buffer();

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
        } while (tries < 5);
        if(tries == 6) {
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
                "cookie": "_ga_0R3R3ETY5T=GS1.1.1667811353.1.1.1667811473.0.0.0; _ga_44L8XKS6ZJ=GS1.1.1670137045.3.0.1670137048.0.0.0; _ga_KFSXGDCJL4=GS1.1.1670552827.3.1.1670554415.0.0.0; _ga_TCEW4F368E=GS1.1.1672918590.10.0.1672918590.0.0.0; _ga=GA1.1.947417450.1667811354; _ga_DRWG84QF1P=GS1.1.1676623832.3.1.1676623845.0.0.0; _ga_8LVYL5D30Z=GS1.1.1676623832.3.0.1676623845.0.0.0; TS01860c62=01dba9d2283c80dfc9c2e63410d8f99f7eb373994552ce9bfb51853db6546fcd200f80d8b73c0239df883c58bcf7477f86cb9ae228",
                "Referer": "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": `account=${studentid}&passwd=${password}&passwd2=${answer}&Submit=%B5n%A4J&fnstr=${pwdstr}`,
            "method": "POST"
        });
        const resHTML = await response.text()
        console.log(resHTML);
        if(resHTML.match(/ACIXSTORE=([a-zA-Z0-9_-]+)/)?.length == 0) {
            return await ocrAndLogin(_try++);
        }
        else {
            const ACIXSTORE = resHTML.match(/ACIXSTORE=([a-zA-Z0-9_-]+)/)?.[1];
            return json({resHTML: resHTML, ACIXSTORE: ACIXSTORE});
        }
    }
    const result = await ocrAndLogin();
    await worker.terminate();

    return result;
}
