let express = require('express');
let Queue = require('bull');
let uniqid = require('uniqid');

let PORT = process.env.PORT || '5000';
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let app = express();
app.use(express.json())

let workQueue = new Queue('work', REDIS_URL);
console.log(workQueue)


app.get('/client.js', (req, res) => res.sendFile('client.js', { root: __dirname }));

app.post('/job-submitter-3000', async (req, res) => {
    let uniqidkey= uniqid();
    let job = await workQueue.add({"decrypted":null,"plainText":req.body.plaintext},{"jobId":uniqidkey});
    let job2 =await workQueue.getJob(uniqidkey)
    res.send(`http://localhost:5000/job/${uniqidkey}`)
});

app.get('/job/:id', async (req, res) => {
    let id = req.params.id;
    let job = await workQueue.getJob(id);
    if (job === null || job.data.decrypted ===null) {
        res.status(404).end();
    } else {
        res.status(200).send(job.data.decrypted) 
    }
});
workQueue.process(30, async (job) => {
    return "This will be stored";
});

workQueue.on('completed', async (job, result) => {
    console.log(result+"completed")
    job.update({"decrypted":result})
});

app.listen(PORT, () => console.log("Server started!"));