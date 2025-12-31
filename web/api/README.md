To initialize the API we need

- Create and edit enviroment file _.env_ following the _.env.example_ file
- Create Private/Public keys for the JWT Tokens

To create the keys:

```
mkdir jwt_keys
cd jwt_keys
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out jwt-private.pem
openssl rsa -pubout -in jwt-private.pem -out jwt-public.pem
```
