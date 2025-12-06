import "dotenv/config";
import express from 'express';
import type { Request, Response } from 'express';
import cors from "cors"
import userRouter from "./routes/user.route.js"
import emailRouter from './routes/email.route.js';
import vendorRouter from './routes/vendor.route.js';
import { inboundHandler } from "./controller/email.controller.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin : ["http://localhost:3000","https://sendgrid.api-docs.io"]
}))

app.use("/api/users",userRouter);
app.use(express.json({ limit: '5mb' }));
app.use('/api/email', emailRouter);
app.use('/api/vendors', vendorRouter);

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, harsh!');
});

app.post("/api/email/inbound", inboundHandler);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;
