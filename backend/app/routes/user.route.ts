import { Router } from "express";
import userController from "../controller/user.controller.js"
import userRfpController from "../controller/rfp.controller.js"


const router = Router();  

router.post("/signup", userController.ValidateUser, userController.signup);
router.post("/login", userController.ValidateLogin, userController.login);
router.post("/userRfpRequest", userRfpController.validateRfpParser, userRfpController.userRfpParser);
router.get("/rfps/:userId", userRfpController.getUserRfps);
router.get("/rfp/:rfpId", userRfpController.getRFPById);

export default router;