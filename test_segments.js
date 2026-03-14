
const pathStr = "/projects";
const cleanPath = pathStr.endsWith('/') && pathStr.length > 1 ? pathStr.slice(0, -1) : pathStr;
const prefixSegments = cleanPath.split('/').filter(Boolean).length;
console.log("cleanPath:", cleanPath);
console.log("prefixSegments:", prefixSegments);

const keys = [
    "/projects/uuid1",
    "/projects/uuid1/metadata",
    "/projects/uuid1/metadata/translations",
    "projects/uuid2"
];

keys.forEach(key => {
    const segments = key.split('/').filter(Boolean);
    console.log(`Key: ${key}, Segments: ${segments.length}, Match: ${segments.length === prefixSegments + 1}`);
});
