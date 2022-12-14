var Express = require("express");
var Multer = require("multer");
var Minio = require("minio");
const multers3 = require('multer-s3');
var BodyParser = require("body-parser");
var app = Express();
const path = require('path')

app.use(BodyParser.json({limit: "4mb"}));

var minioClient = new Minio.Client({
    endPoint: '127.0.0.1',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin'
});

let midmulter = Multer({
    storage:Multer.diskStorage({
        destination:'./uploads',
        filename:function(req, file, cb){
            cb(null, file.fieldname+ '-'+path.extname(file.originalname))
        },
        fileFilter:function(req, file, cb) {
            cb(null, file.originalname)
        }
    })
})

app.post("/upload", Multer({storage: Multer.memoryStorage() }).single("upload"), function(request, response) {
    // console.log(request.file)
    let constentTYpes = {
        'Content-type':'image/png'
    }
    minioClient.putObject("mybucket", request.file.originalname, request.file.buffer,  constentTYpes, function(error, etag) {
        if(error) {
            return console.log(error);
        }
        response.send(request.file);
    });
});

app.get("/make", (req, res) => {
    // minioClient.makeBucket()
    minioClient.makeBucket('mybuckets', 'us-east-1', function(err) {
        if (err) {
            console.log(err)
            return res.send({err:true})
        }
        return res.send({err:false})
    })
})

app.post("/uploadfile", midmulter.single('file'), function(request, response) {
    let constentTYpes = {
        'Content-type':'image/png'
    }
    minioClient.fPutObject("mybucket", request.file.originalname, request.file.path, constentTYpes, function(error, etag) {
        if(error) {
            return console.log(error);
        }
        response.send(request.file);
    });
});

app.get("/download", function(request, response) {
    minioClient.getObject("test", request.query.filename, function(error, stream) {
        if(error) {
            return response.status(500).send(error);
        }
        stream.pipe(response);
    });
});

minioClient.bucketExists("test", function(error) {
    if(error) {
        return console.log(error);
    }
    var server = app.listen(3000, function() {
        console.log("Listening on port %s...", server.address().port);
    });
});