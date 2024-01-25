#!/bin/bash

importDb() {
	echo "--------- START: IMPORT MYSQL DB $1 < $2 ---------"
	mysql -h$MYSQL_HOST -P$MYSQL_TCP_PORT -u$MYSQL_USER -p$MYSQL_ROOT_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $1"
	mysql -h$MYSQL_HOST -P$MYSQL_TCP_PORT -u$MYSQL_USER -p$MYSQL_ROOT_PASSWORD $1 < $2
	echo "---------   END: IMPORT MYSQL DB $1 < $2 ---------"
}

init() {				
	sh /usr/local/bin/docker-php-entrypoint php-fpm	&
	mysql -h$MYSQL_HOST -P$MYSQL_TCP_PORT -u$MYSQL_USER -p$MYSQL_ROOT_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE"		
	echo "mysql -h$MYSQL_HOST -P$MYSQL_TCP_PORT -u$MYSQL_USER -p$MYSQL_ROOT_PASSWORD -e 'CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE'"		
	ln -sf dump/* /mysql-dump/.
	chmod -R 777 /socket
	gulp --gulpfile=/gulp/gulpfile.js watchSass &	
    #tail -f /var/www/html/project/$TAIL_FILE_DEBUG
	tail -f
}

execQuery() {
	mysql -h$MYSQL_HOST -P$MYSQL_TCP_PORT -u$MYSQL_USER -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE -e "$1"
}

case "$1" in	
	mostra)
			echo "==> $MYSQL_DATABASE ==> $MYSQL_ROOT_PASSWORD => $MYSQL_USER ==> $MYSQL_PASSWORD ==> $MYSQL_HOST ==> $MYSQL_TCP_PORT"
		;;
	execQuery)
		execQuery "$2"
		;;
	importDb)
		importDb "$2" "$3"
		;;

	init)
		init
		;;	

	psalm)
#		update_php_dependences

		./vendor/bin/psalm
		;;

	cs)
#		update_php_dependences

		./vendor/bin/phpcs -n
		;;

	csgithub)
#		update_php_dependences

		./vendor/bin/phpcs --report=summary -n -p
		;;

	cbf)
#		update_php_dependences

		./vendor/bin/phpcbf
		;;

	pstan)
		./vendor/bin/phpstan analyse
		;;

	bash)
		/bin/bash
		;;
	sh)
		/bin/sh
		;;

	*)
		echo "This container accepts the following commands:"
		echo "- importDb <name.sql>"
		echo "- Init"		
		echo "- psalm"
		echo "- cs (CodeSniffer phpcs)"
		echo "- cbf (CodeSniffer phpcbf)"
		echo "- pstan (PHPStan)"
		echo "- bash"
		echo "- sh"
		exit 1
esac