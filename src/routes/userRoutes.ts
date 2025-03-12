import express, { Router } from 'express';
import {store} from '../controllers/userController'
const router: Router = express.Router();

router.post("/",store);




export default router;