#!/bin/bash
#

echo "Init mongo configserver and shards"
docker compose exec configsvr01 sh -c "mongosh < /scripts/init-configserver.js"

docker compose exec shard01-a sh -c "mongosh < /scripts/init-shard01.js"
docker compose exec shard02-a sh -c "mongosh < /scripts/init-shard02.js"

echo  "waiting for shards to bootup"
sleep 30 #replace with until eval -- 'rs.status()'

echo "Init mongo router"
docker compose exec router01 sh -c "mongosh < /scripts/init-router.js"

echo "Init database with sharding"
docker compose exec router01 sh -c "echo 'use formfactor' | mongosh"
docker compose exec router01 sh -c "mongosh < /scripts/init-collection.sh"