'use strict'

export const name = 'example-basic'

export const parameters = {
	endpoint: 'https://fr.wikipedia.org/wiki/Web_scraping'
}

export const run = async page => {

	const data = await page.evaluate(() => {

		let section = document.querySelector('#Applications_utilisant_le_Web_scraping')
		let links   = section.parentElement.nextElementSibling

		links = [ ...links.querySelectorAll('li > a:first-of-type') ].map(a => a.href)
		links = links.filter(a => !a.includes('&redlink=1'))

		return links
	})

	return data
}