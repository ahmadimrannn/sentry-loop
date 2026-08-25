import time


LINK_TTL_SECONDS = 60*60*24*3
TIME = int(time.time()) + LINK_TTL_SECONDS

print(TIME)

secret = 'cjkdjfuae9u93938493fdjkjc839iii'

sec = secret.encode()
print(sec)
dec_sec = sec.decode()
print(dec_sec)