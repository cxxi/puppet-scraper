# puppet-scraper
Scrap using your custom scripts with merge, download, callback and more functionality (based on puppeteer)

```bash
# for puppet-scraper
npm install -S puppet-scraper
# to use puppet-scraper cli
npm link puppet-scraper

```

> Requires Node.js >= 13.0.2
> Use `ECMAScript modules` so you must use `ES module` `imports`/`exports`

## Usage

import Scraper from 'puppet-scraper'
const scraper = new Scraper(/*scrapConf.options*/)

/*await scraper.enqueue(`${rootPath}/${scrapConf.scriptsDir}`)
		await scraper.scrap()*/

option 
debug ?





Basic initialization puppet-scraper:

```js

import Scraper from 'puppet-scraper'

const createTasks = (name, i) => (new Task(name)).define({ 
	endpoint: endpoint,
	order: i
}, run1)

const endpoint = 'https://fr.wikipedia.org/wiki/Web_scraping'

const run1 = async page => {

	const data = await page.evaluate(() => {

		let section = document.querySelector('#Applications_utilisant_le_Web_scraping')
		let links   = section.parentElement.nextElementSibling

		links = [ ...links.querySelectorAll('li > a:first-of-type') ].map(a => a.href)
		links = links.filter(a => !a.includes('&redlink=1'))

		return links
	})

	return data
}

const run2 = async page => {

	const data = await page.evaluate(() => {
		let imgs = document.querySelectorAll('img')
		imgs = [ ...imgs].map(i => i.src)
		return imgs
	})

	return data
}

const run3 = async page => {

	const data = await page.evaluate(() => {
		let title = document.querySelector('title')
		let description = document.querySelector('meta[name="generator"]')
		return [title.innerHTML, description.getAttribute('content')]
	})

	return data
}

const scraper = new Scraper({ sort: true })
	
let taskA = new Task('task-A')
taskA.define({ endpoint: endpoint}, run1)

let taskB = (new Task('task-B')).define({ endpoint: endpoint}, run2)

await scraper.enqueue([
	taskA, 
	taskB, 
	(new Task('task-C')).define({ endpoint: endpoint}, run3)
])

console.log(scraper.getTasks())

const data = await scraper.scrap()

console.log(data)

```