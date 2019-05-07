const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator/check");
const auth = require("../../middleware/auth");

const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @Route   POST /api/posts
// @Desc    Create a post
// @Access  Private
router.post(
  "/",
  [
    auth,
    [
      check("text", "Post text is required.")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      const post = await newPost.save();

      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error.");
    }
  }
);

// @Route   GET /api/posts
// @Desc    Get all posts
// @Access  Private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error.");
  }
});

// @Route   GET /api/posts;?id
// @Desc    Get posts by ID
// @Access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not Found." });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not Found." });
    }
    res.status(500).send("Server Error.");
  }
});

// @Route   DELETE /api/posts/:id
// @Desc    Delete post
// @Access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: "Post not Found." });

    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not Authorized to Delete." });
    }

    await post.remove();

    res.json({ msg: "Post Removed." });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not Found." });
    }
    res.status(500).send("Server Error.");
  }
});

// @Route   PUT /api/posts/like/:id
// @Desc    Like a post
// @Access  Private
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: "Post is already liked." });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error.");
  }
});

// @Route   PUT /api/posts/unlike/:id
// @Desc   UnlLike a post
// @Access  Private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: "Post is not liked yet." });
    }

    //Index to be removed
    const rmvIdx = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(rmvIdx, 1);

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error.");
  }
});

// @Route   POST /api/posts/comment/:id
// @Desc    Create a comment on a Post
// @Access  Private
router.post(
  "/comment/:id",
  [
    auth,
    [
      check("text", "Comment text is required.")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      };

      post.comments.unshift(newComment);

      post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error.");
    }
  }
);

// @Route   DELETE /api/posts/comment/:id/:comm_id
// @Desc    Delete a comment from a Post
// @Access  Private
router.delete("/comment/:id/:comm_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //pull out comment
    const comment = post.comments.find(
      comment => comment.id === req.params.comm_id
    );

    if (!comment)
      return res.status(404).json({ msg: "Comment does not Exist." });

    if (comment.user.toString() !== req.user.id)
      return res.status(401).json({ msg: "User not Authorized." });

    //Index to be removed
    const rmvIdx = post.comments
      .map(comment => comment.user.toString())
      .indexOf(req.user.id);

    post.comments.splice(rmvIdx, 1);

    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error.");
  }
});

module.exports = router;
