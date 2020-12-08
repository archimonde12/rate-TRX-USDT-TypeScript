local keys = redis.call('keys', KEYS[1])
local values = redis.call('mget', unpack(keys))
local keyValuePairs = {}
for i = 1, #keys do
  keyValuePairs[i] = .. values[i]
end
return keyValuePairs