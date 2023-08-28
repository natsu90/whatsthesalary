
## WhatstheSalary

JobStreet Salary Checker

Inspired by [www.whatsthesalary.com](https://www.whatsthesalary.com/)

Supporting sites from `jobstreet.com.my`, `jobstreet.com.sg`, & `th.jobsdb.com`

### Installation

```
npm install natsu90/whatsthesalary

node node_modules/puppeteer/install.js

```

### Usage

```
import getJobDetails, { browser } from 'whatsthesalary';

const jobDetails = await getJobDetails('https://www.jobstreet.com.my/en/job/full-stack-developer-5496381')

console.log(jobDetails)

// output
{
  link: 'https://www.jobstreet.com.my/en/job/full-stack-developer-5496381',
  workPosition: 'Full Stack Developer',
  companyName: 'Mohicans Marketing Sdn. Bhd.',
  minimumSalary: 5000,
  maximumSalary: 11000
}

browser.off('disconnected')
await browser.close()

```

OR

```
npm run check "job link"

e.g

npm run check "https://www.jobstreet.com.my/en/job/full-stack-developer-5496381?jobId=jobstreet-my-job-5496381&sectionRank=2&token=0~e3f9adcc-e26e-4e83-8a8b-e3415ea86e73&fr=SRP%20View%20In%20New%20Tab"
```

### Fetching Data

This library is not using the official API. It is only visiting the original website and make use of the salary filters. Sometimes the salary is not the same as displayed.

### License

Licensed under the [MIT license](http://opensource.org/licenses/MIT)
