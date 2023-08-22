
// import puppeteer from 'puppeteer'; // set headless to false when this is uncomment
// OR
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin())

const hiddenCompanyString = 'Company Confidential';
const workPositionSelectorString = '[data-automation="detailsTitle"] div div:nth-of-type(1)';
const companyNameSelectorString = '[data-automation="detailsTitle"] div div:nth-of-type(2)';
const nextButtonXpathString = '//div[@data-automation="pagination"][div/@data-automation="pagination-dropdown"]/a[span[text()="Next"]]';
const supportedSites = [
    'th.jobsdb.com',
    'www.jobstreet.com.sg',
    'www.jobstreet.com.my'
];

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
            maximum = 30000;
            salaryParameters = ['salary', 'salary-max'];
    }

    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disabled-setupid-sandbox']
    });
    const page = await browser.newPage();

    // Open the link
    await page.goto(link);

    // Grab Job Basic Details
    let workPosition, companyName;
    try {
        const workPositionSelector = await page.waitForSelector(workPositionSelectorString);
        workPosition = await workPositionSelector?.evaluate(el => el.textContent);

        const companyNameSelector = await page.waitForSelector(companyNameSelectorString);
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

    // Finding Minimum Salary
    let minimumSalary;
    let maximumIncrement = ( maximum - minimum ) / increment;

    for (let i = 0; i < maximumIncrement; i++) {

        minimumSalary = i*1*increment + minimum;

        let salarySearchUrl = searchUrl;
        salarySearchUrl.searchParams.set(salaryParameters[0], 0);
        salarySearchUrl.searchParams.set(salaryParameters[1], minimumSalary);

        await page.goto(salarySearchUrl.href);

        let hasResult = (await page.$x(`//a[contains(@href, '${url.pathname}')]`)).length > 0;

        if (!hasResult) {

            const hasPagination = (await page.$x(`//select[@id='pagination']`)).length > 0;

            if (hasPagination) {
                
                const [lastPageNumberXpath] = await page.$x(`//select[@id="pagination"]/option[last()]`);
                const lastPage = await page.evaluate(el => el.innerText, lastPageNumberXpath);

                let hasResultInPage = false;

                for (let j = 2; j <= lastPage; j++) {

                    await page.waitForXPath(nextButtonXpathString)
                    const [nextXpath] = await page.$x(nextButtonXpathString);
                    const nextLink = await page.evaluate(el => el.getAttribute('href'), nextXpath);
                    await page.goto(url.origin + nextLink);

                    hasResult = (await page.$x(`//a[contains(@href, '${url.pathname}')]`)).length > 0;

                    if (hasResult) {
                        hasResultInPage = true;
                    }
                }

                if (hasResultInPage) {
                    break;
                }
            }
            continue;
        }
        break;
    }

    // Finding Maximum Salary
    maximumIncrement = ( maximum - minimumSalary ) / increment;
    let maximumSalary;

    for (let i = 1; i < maximumIncrement; i++) {

        maximumSalary = i*1*increment + minimumSalary;

        let salarySearchUrl = searchUrl;
        salarySearchUrl.searchParams.set(salaryParameters[0], maximumSalary);
        salarySearchUrl.searchParams.set(salaryParameters[1], maximum);

        await page.goto(salarySearchUrl.href);

        let hasResult = (await page.$x(`//a[contains(@href, '${url.pathname}')]`)).length > 0;

        if (!hasResult) {

            const hasPagination = (await page.$x(`//select[@id='pagination']`)).length > 0;

            if (hasPagination) {

                const [lastPageNumberXpath] = await page.$x(`//select[@id="pagination"]/option[last()]`);
                const lastPage = await page.evaluate(name => name.innerText, lastPageNumberXpath);

                let hasResultInPage = false;

                for (let j = 2; j <= lastPage; j++) {

                    await page.waitForXPath(nextButtonXpathString)
                    const [nextXpath] = await page.$x(nextButtonXpathString);
                    const nextLink = await page.evaluate(el => el.getAttribute('href'), nextXpath);
                    await page.goto(url.origin + nextLink);

                    hasResult = (await page.$x(`//a[contains(@href, '${url.pathname}')]`)).length > 0;

                    if (hasResult) {
                        hasResultInPage = true;
                    }
                }

                if (hasResultInPage) {
                    continue;
                }
            }
            break;
        }
    }

    return {
        link: url.origin + url.pathname,
        workPosition: workPosition,
        companyName: companyName,
        minimumSalary: minimumSalary,
        maximumSalary: maximumSalary - increment
    };
}

export default getJobDetails;
