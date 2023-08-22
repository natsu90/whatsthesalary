
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
import getJobDetails from 'whatsthesalary';

const jobDetails = getJobDetails('https://www.jobstreet.com.my/en/job/full-stack-developer-5496381')

console.log(jobDetails)

// output
{
  link: 'https://www.jobstreet.com.my/en/job/full-stack-developer-5496381',
  workPosition: 'Full Stack Developer',
  companyName: 'Mohicans Marketing Sdn. Bhd.',
  minimumSalary: 5000,
  maximumSalary: 11000
}

```

### Fetching Data

This library is not using the official API. It is only visiting the original website and make use of the salary filters. Sometimes the salary is not the same as displayed.

### License

Licensed under the [MIT license](http://opensource.org/licenses/MIT)
