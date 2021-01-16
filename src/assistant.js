'use strict'

import inquirer from 'inquirer'

import Core from './core.js'


export default class Assistant extends Core
{
	constructor(argv){ super() }

	async getUI()
	{
		return console.log("> Cli is not implemented yet\n")
	}
}