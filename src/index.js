'use strict'

import Assistant from './assistant.js'
import Scraper   from './scraper.js'
import { Task }  from './core.js'

const Cli = async argv => {

	try
	{
		const assistant = new Assistant()
		const query = assistant.prevent(argv.splice(2))

		query[0] = query[0] !== undefined
			? await assistant[`ask_${query[0]}UI`]()
			: await assistant.ask_context()

		if (query[0] == 'end') process.exit(0)
		if (query[0] == 'back') await assistant.ask_context()

		query[1] = query[1] !== undefined
			? await assistant[`ask_${query[0]}UI`]()
			: await assistant[`ask_${query[0]}UI`]()
			
		console.log(query)
		// switch(argv[2])
		// {
		// 	case undefined: return await assistant.getUI()
		// }
		
		process.exit(0)
	}

	catch(e)
	{ 
		console.error(e)
		process.exit(1)
	}
}

export { Cli, Scraper, Task }
export default Scraper