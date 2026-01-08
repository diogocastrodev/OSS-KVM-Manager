To initialize the API we need

- Create and edit enviroment file _.env_ following the _.env.example_ file
- Define Secret or creaet Private/Public keys for the JWT Tokens

### JWT

Add Secret:
_.env_

```env
JWT_MODE="secret" # This is optional as it's the default value
JWT_SECRET="secret_key"
```

---

To create the keys:

```
mkdir jwt_keys
cd jwt_keys
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out jwt-private.pem
openssl rsa -pubout -in jwt-private.pem -out jwt-public.pem
```

In: _.env_

```env
JWT_MODE="keys"
```
