import { defineEventHandler, readBody, sendRedirect } from 'h3';

export default defineEventHandler(async (event) => {
    // console.log(event)
    const body = await readBody(event);
    // sessionStorage.setItem('inicisResult', body)
    await sendRedirect(event, `/payment/inicis/processing?resultBody=${encodeURIComponent(JSON.stringify(body))}`)
    // Process the body data
    // return { message: 'Data received', data: body };
});