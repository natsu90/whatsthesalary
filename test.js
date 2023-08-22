
import getJobDetails from './lib.js';
import assert from 'assert';


const thJobLink = 'https://th.jobsdb.com/th/en/job/full-stack-web-developer-php-laravel-manufacturing-industry-300003002905209?token=0~4aadb715-e9c0-43a9-80de-b3c8e0be1220&sectionRank=8&jobId=jobsdb-th-job-300003002905209';
const thJob = await getJobDetails(thJobLink)

console.log(thJob);

const myJobLink = 'https://www.jobstreet.com.my/en/job/full-stack-developer-5496381?jobId=jobstreet-my-job-5496381&sectionRank=2&token=0~e3f9adcc-e26e-4e83-8a8b-e3415ea86e73&fr=SRP%20View%20In%20New%20Tab';
const myJob = await getJobDetails(myJobLink)

console.log(myJob)

const sgJobLink = 'https://www.jobstreet.com.sg/en/job/web-development-maintenance-engineer-10983973?jobId=jobstreet-sg-job-10983973&sectionRank=10&token=0~d67af063-9725-498d-9eb8-ec1786d04521&fr=SRP%20View%20In%20New%20Tab';
const sgJob = await getJobDetails(sgJobLink)

console.log(sgJob)

process.exit()