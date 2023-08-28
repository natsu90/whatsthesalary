
import getJobDetails, { browser } from './lib.js';

const link = process.argv[2]

const job = await getJobDetails(link)

console.log(job)

browser.off('disconnected')
await browser.close();
process.exit()