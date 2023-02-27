import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, url  }) => {
    const studentid = url.searchParams.get('account');
    const token = url.searchParams.get('ACIXSTORE');

    await fetch(`https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/IN_INQ_STU.php?ACIXSTORE=${token}`, {
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
            "Referer": `https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php?ACIXSTORE=${token}&hint=${studentid}`,
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
        });
    
    return await fetch(`https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/time.php?account=${studentid}&ACIXSTORE=${token}`, {
        "headers": {
          "accept": "*/*",
          "accept-language": "en-US,en;q=0.9",
          "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Microsoft Edge\";v=\"110\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
          "Referer": `https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/top.php?account=${studentid}&ACIXSTORE=${token}`,
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    })
    .then(res => {
        if(!res.ok) {
            throw error(res.status, res.statusText);
        }
        return res.json()
    })
    .then(data => {
        return json(data);
    })
}
