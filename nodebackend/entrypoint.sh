#!/bin/bash


init() {		
	echo "avvio"
	npm cache clean -f			
	npm install
	npm install -g nodemon
	cd /home/node/app 	
	NODE_ENV=development  nodemon --exec 'tsx src/commands/Server.ts'	
}


case "$1" in	
	
	init)
		init
		;;		
	bash)
		/bin/bash
		;;
	sh)
		/bin/sh
		;;

	*)
		echo "This container accepts the following commands:"		
		echo "- Init"				
		echo "- bash"
		exit 1
esac