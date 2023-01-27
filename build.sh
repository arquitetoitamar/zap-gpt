docker build . -t bot615026068056.dkr.ecr.us-east-1.amazonaws.com/bot:latest
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 615026068056.dkr.ecr.us-east-1.amazonaws.com
docker tag bot:latest 615026068056.dkr.ecr.us-east-1.amazonaws.com/bot
docker push 615026068056.dkr.ecr.us-east-1.amazonaws.com/bot
aws ecs update-service --cluster gerenciapedidos-prd --service bot-service 

