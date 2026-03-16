import express from 'express';
import CommentController from '../controllers/CommentController';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import {
  validateCommentCreate,
  validateCommentReply,
  validateCommentStatusUpdate,
  validationHandler,
} from '../middlewares/validators';
import { USER_ROLES } from '../utils/constants';

const router = express.Router();

router.get('/movies/:movieId', CommentController.getMovieComments);
router.post('/', authenticate, validateCommentCreate, validationHandler, CommentController.createComment);
router.get(
  '/manage',
  authenticate,
  authorizeRoles(USER_ROLES.STAFF, USER_ROLES.ADMIN),
  CommentController.getManageComments
);
router.post(
  '/:commentId/replies',
  authenticate,
  authorizeRoles(USER_ROLES.STAFF, USER_ROLES.ADMIN),
  validateCommentReply,
  validationHandler,
  CommentController.replyToComment
);
router.patch(
  '/:commentId/status',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateCommentStatusUpdate,
  validationHandler,
  CommentController.updateCommentStatus
);

export default router;
