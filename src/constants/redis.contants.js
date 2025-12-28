export const securitycodeLua = `
local data = redis.call("GET", KEYS[1])
if not data then
  return nil
end

-- Safe JSON decode (no hard crash)
local ok, obj = pcall(cjson.decode, data)
if not ok or type(obj) ~= "table" then
  redis.call("DEL", KEYS[1])
  return nil
end

local otherKey = obj.securitycode

-- Delete primary key
redis.call("DEL", KEYS[1])

-- Delete linked key only if valid
if type(otherKey) == "string" and otherKey ~= "" then
  redis.call("DEL", otherKey)
end

return data
`;
