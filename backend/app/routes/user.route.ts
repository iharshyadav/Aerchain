import { Router } from "express";
import userController from "../controller/user.controller.js"
import userRfpController from "../controller/rfp.controller.js"


const router = Router();  

router.post("/signup", userController.ValidateUser, userController.signup);
router.post("/userRfpRequest", userRfpController.validateRfpParser, userRfpController.userRfpParser);

export default router;