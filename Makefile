setup.mongo:
	(cd ./infra/mongo-cluster && docker-compose up)
	sleep 30
	bash ./infra/mongo-cluster/init.sh

setup.mysql:
	(cd ./infra/mysql docker-compose up -d)

setup.app.db:
	node cmd/cli/index.mjs migrate -c ./config/.env -d mongo
	node cmd/cli/setup.mjs migrate -c ./config/.env -d mysql -f ./database/mysql/00001_create_tables.up.sql

run: setup.mongo setup.mysql setup.app.db
	node cmd/server/index.mjs
