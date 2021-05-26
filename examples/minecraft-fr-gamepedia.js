'use strict'

export const name = 'minecraft_items_fr'

export const parameters = {
	endpoint: 'https://minecraft-fr.gamepedia.com/Valeurs',
	order: 1
}

export const run = async page => {

	/* delimiters = []
	 * use (h3 + table tr > td)
	 * assign type from delimiters
	 */

	await page.waitForTimeout(1500)

	return await page.evaluate(() => {
	
		let extracted = {}
			
		for(let row of Array.from(document.querySelectorAll('table.wikitable tr')))
		{
			let item = { name: {}, icon: {} }

			let icon = row.querySelector('td > a > img')
			if (icon != null) item.icon.dyn = parseInt(icon.src.split('?cb=')[1])

			let name = row.querySelector('td > a:last-of-type')
			item.name.fr = name != null ? name.innerText : false

			let id = row.querySelector('td > code')
			id = id != null ? id.innerText : false

			if (id == false || id == 0) continue
			if (id == 'blaze') return extracted

			extracted[id] = item
		}
	})
}

// export const dataTransform = async data => data