'use strict'

import Assistant from './assistant.js'
import Scraper from './scraper.js'
import Task from './task.js'


const defaultOptions = {
	rawResult: false, 
	merge: false,
	sort: false,
	downloads: [],
	dlSeparator: '>'
}

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

export { Cli, Task, defaultOptions }
export default Scraper