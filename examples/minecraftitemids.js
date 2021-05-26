'use strict'

export const name = 'minecraft_items_en'

export const parameters = {
	endpoint: 'https://minecraftitemids.com/',
	downloads: ['icon>static>32', 'icon>static>64', 'icon>static>128'],
	outputDir: '/var/www/ovium/assets/images/minecraft',
	order: 0
}

export const run = async page => {

	await page.waitForTimeout(500)

	if ((await page.$('.float-right > .btn-pagination')) || false) {
		await page.click('button.fc-cta-consent.fc-cta-consent')
	}

	let nextPage = true, data = {}

	while(nextPage)
	{
		await page.waitForTimeout(1000)
		// await page.screenshot({path: (new Date().getTime())+'.png'})
		await page.click('button#tableViewBtn')
		await page.waitForTimeout(500)

		data = Object.assign({}, data, await page.evaluate(() => {   

			let extrated = {}
			
			for (let row of Array.from(document.querySelectorAll('#table > tbody > tr.tsr')))
			{
				let item = {}

				if (row.querySelectorAll('td.ts') != null) {
					item.id = (row.querySelectorAll('td.ts')[1].innerText).split(':')[1]
				}

				if (row.querySelector('td.ts > a') != null) {
					item.name = row.querySelector('td.ts > a').innerText
				}

				if (row.querySelector('td.ic > a > img') != null) {
					const switchSize = (s, u) => u.split('/').map(f => u.split('/').indexOf(f) == 2 ? s : f).join('/')
					const src = row.querySelector('td.ic > a > img').getAttribute('src')
					item.icons = {static: {'128': switchSize(128, src), '64': src, '32': switchSize(64, src) }}

				}

				extrated[item.id] = { name: { en: item.name }, icon: item.icons }
			}

			return extrated
		}))

		await page.waitForTimeout(500)
		
		if ((await page.$('.float-right > .btn-pagination')) || false) {
			await page.click('.float-right > .btn-pagination')
		} else { nextPage = false }
	}

	return data
}

// export const dataTransform = async data => data