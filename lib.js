
// import puppeteer from 'puppeteer'; // set headless to false when this is uncomment
// OR
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin())

import { map } from 'async';

const hiddenCompanyString = 'Company Confidential';
const workPositionSelectorString = '[data-automation="detailsTitle"] div div:nth-of-type(1)';
const companyNameSelectorString = '[data-automation="detailsTitle"] div div:nth-of-type(2)';
const nextButtonXpathString = '//div[@data-automation="pagination"][div/@data-automation="pagination-dropdown"]/a[span[text()="Next"]]';
const supportedSites = [
    'th.jobsdb.com',
    'www.jobstreet.com.sg',
    'www.jobstreet.com.my'
];
const __dirname = new URL('.', import.meta.url).pathname;

// Launch the browser 
let browser;
const launchBrowser = async() => {

    browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--autoplay-policy=user-gesture-required',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-breakpad',
            '--disable-client-side-phishing-detection',
            '--disable-component-update',
            '--disable-default-apps',
            '--disable-domain-reliability',
            '--disable-extensions',
            '--disable-features=AudioServiceOutOfProcess',
            '--disable-hang-monitor',
            '--disable-ipc-flooding-protection',
            '--disable-notifications',
            '--disable-offer-store-unmasked-wallet-cards',
            '--disable-popup-blocking',
            '--disable-print-preview',
            '--disable-prompt-on-repost',
            '--disable-renderer-backgrounding',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-speech-api',
            '--disable-sync',
            '--hide-scrollbars',
            '--ignore-gpu-blacklist',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-default-browser-check',
            '--no-first-run',
            '--no-pings',
            '--no-zygote',
            '--password-store=basic',
            '--use-gl=swiftshader',
            '--use-mock-keychain',
            '--single-process',
            '--disable-gpu',
            '--disable-features=site-per-process'
        ],
        userDataDir: __dirname + '/cache'
    });
    browser.once('disconnected', launchBrowser)
    return browser
}

browser = await launchBrowser();

export { browser };

const hasResultInRange = async (minimumValue, maximumValue, params) => {

    const salarySearchUrl = params.searchUrl;
    salarySearchUrl.searchParams.set(params.salaryParameters[0], minimumValue);
    salarySearchUrl.searchParams.set(params.salaryParameters[1], maximumValue);

    const salaryFilterUrl = salarySearchUrl.href
    const searchPage = await browser.newPage()

    await searchPage.goto(salaryFilterUrl);

    let hasResult = (await searchPage.$x(`//a[contains(@href, '${params.url.pathname}')]`)).length > 0;

    if (!hasResult) {

        const hasPagination = (await searchPage.$x(`//select[@id='pagination']`)).length > 0;

        if (hasPagination) {
            
            const [lastPageNumberXpath] = await searchPage.$x(`//select[@id="pagination"]/option[last()]`);
            const lastPage = await searchPage.evaluate(el => el.innerText, lastPageNumberXpath);

            for (let j = 2; j <= lastPage; j++) {

                await searchPage.waitForXPath(nextButtonXpathString)
                const [nextXpath] = await searchPage.$x(nextButtonXpathString);
                const nextLink = await searchPage.evaluate(el => el.getAttribute('href'), nextXpath);
                await searchPage.goto(params.url.origin + nextLink);

                hasResult = (await searchPage.$x(`//a[contains(@href, '${params.url.pathname}')]`)).length > 0;

                if (hasResult) {
                    await searchPage.close()
                    return true;
                }
            }
        }
        await searchPage.close()
        return false;
    }
    await searchPage.close()
    return true;
}

const asyncSome = async (arr, predicate) => {
    for (let e of arr) {
        if (await predicate(e)) return true;
    }
    return false;
};

const getJobDetails = async (link) => {

    const url = new URL(link);

    if (!supportedSites.includes(url.host)) {
        throw new Error('URL is not supported!');
    }

    let minimum, increment, maximum, salaryParameters;

    switch (url.host) {
        case 'th.jobsdb.com':
            minimum = 5000;
            increment = 5000;
            maximum = 250000;
            salaryParameters = ['SalaryF', 'SalaryT'];
            break;
        case 'www.jobstreet.com.sg':
        case 'www.jobstreet.com.my':
        default:
            minimum = 500;
            increment = 500;
            maximum = 25000;
            salaryParameters = ['salary', 'salary-max'];
    }

    // Open a new blank page
    const page = await browser.newPage();

    // Disable other resources to optimise
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['stylesheet', 'font', 'image'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });

    // Open the link
    await page.goto(link);

    // Grab Job Basic Details
    let workPosition, companyName;
    try {
        const workPositionSelector = await page.waitForSelector(workPositionSelectorString, 500);
        workPosition = await workPositionSelector?.evaluate(el => el.textContent);

        const companyNameSelector = await page.waitForSelector(companyNameSelectorString, 500);
        companyName = await companyNameSelector?.evaluate(el => el.textContent);
    } catch (error) {
        throw new Error('Page is invalid!');
    }

    // Construct Search URL
    const searchString = companyName !== hiddenCompanyString ? companyName : `"${workPosition}"`;
    await page.goto(url.origin);
    await page.type('#searchKeywordsField', searchString);
    await page.keyboard.press('Enter');
    const searchUrl = new URL(page.url());
    await page.close()

    const browserPageLimit = 10;

    // Finding Minimum Salary
    let minimumSalary;
    let maximumIncrement = ( maximum - minimum ) / increment;

    let minimumSalaryRangeArray = [];

    for (let i = 0; i < maximumIncrement; i++) {

        minimumSalary = i*1*increment + minimum;
        minimumSalaryRangeArray.push({0: 0, 1: minimumSalary})
    }

    /**
     * checking salary range in parallel in chunks of browserPageLimit
     * skip further checking if found in first chunk or so
     */ 
    let chunked = minimumSalaryRangeArray.reduce((all,one,i) => {
        const ch = Math.floor(i/browserPageLimit); 
        all[ch] = [].concat((all[ch]||[]),one); 
        return all
     }, [])

    await asyncSome(chunked, async(chunkedArray) => {
        
        let results = await map(chunkedArray, async (minimumSalaryRange) => {
            
            let hasResult = await hasResultInRange(minimumSalaryRange[0], minimumSalaryRange[1], {
                url: url,
                searchUrl: searchUrl,
                salaryParameters: salaryParameters
            })
            
            const returnValue = hasResult ? minimumSalaryRange[1] : null
            return returnValue
        })

        const minimumSalaryRanges = results.filter((result) => result !== null)
        const IsMinimumSalaryInRange = minimumSalaryRanges.length > 0

        if (IsMinimumSalaryInRange) {
            minimumSalary = Math.min.apply(Math, minimumSalaryRanges)
            return true
        }
    })

    // Finding Maximum Salary
    maximumIncrement = ( maximum - minimumSalary ) / increment;
    let maximumSalary;

    let maximumSalaryRangeArray = [];

    for (let i = 1; i < maximumIncrement; i++) {

        maximumSalary = i*1*increment + minimumSalary;
        maximumSalaryRangeArray.push({0: maximumSalary, 1: maximum})
    }

    chunked = maximumSalaryRangeArray.reduce((all,one,i) => {
        const ch = Math.floor(i/browserPageLimit); 
        all[ch] = [].concat((all[ch]||[]),one); 
        return all
     }, [])

     await asyncSome(chunked, async(chunkedArray) => {

         let results = await map(chunkedArray, async (maximumSalaryRange) => {

            let hasResult = await hasResultInRange(maximumSalaryRange[0], maximumSalaryRange[1], {
                url: url,
                searchUrl: searchUrl,
                salaryParameters: salaryParameters
            })

            const returnValue = hasResult ? maximumSalaryRange[0] : null
            return returnValue
        })
 
        const maximumSalaryRanges = results.filter((result) => result !== null)
        const isMaximumSalaryInRange = results.filter((result) => result === null).length > 0
 
        if (isMaximumSalaryInRange) {
            maximumSalary = Math.max.apply(Math, maximumSalaryRanges)
            return true
        }
     })

    return {
        link: url.origin + url.pathname,
        workPosition: workPosition,
        companyName: companyName,
        minimumSalary: minimumSalary,
        maximumSalary: maximumSalary
    };
}

export default getJobDetails;
