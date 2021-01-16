'use strict'

import Assistant from './assistant.js'
import Scraper from './scraper.js'
import { Task } from './core.js'

const Cli = async argv => {

	try
	{
		const assistant = new Assistant(argv.splice(2))

		switch(argv[2])
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

export { Cli, Task }
export default Scraper