'use strict'

import Assistant from './assistant.js'
import Scraper from './scraper.js'

export const Cli = async argv => {

	try
	{
		const assistant = new Assistant(process.argv.splice(2))

		switch(process.argv[2])
		{
			case undefined: return await assistant.getUI()
		}
		
		process.exit(0)
	}

	catch(e)
	{ 
		console.error(e)
		process.exit(1)
	}

}

export default Scraper