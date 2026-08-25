import Resource from "../models/Resource.js";

const getResources = async (req, res) => {
  try {
    const { search, category, level, platform, featured, status, sort, page = 1, limit = 50 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    if (category) query.category = category;
    if (level) query.level = level;
    if (platform) query.platform = platform;
    if (featured === "true") query.featured = true;
    if (status) query.status = status;
    else query.status = "approved";

    let sortOption = { createdAt: -1 };
    if (sort === "rating") sortOption = { rating: -1 };
    else if (sort === "title") sortOption = { title: 1 };
    else if (sort === "oldest") sortOption = { createdAt: 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Resource.countDocuments(query);
    const resources = await Resource.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("categoryId", "name slug");

    res.json({
      success: true,
      data: { resources, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate("categoryId", "name slug");
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    res.json({ success: true, data: { resource } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createResource = async (req, res) => {
  try {
    const resource = await Resource.create(req.body);
    res.status(201).json({ success: true, data: { resource } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    res.json({ success: true, data: { resource } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    res.json({ success: true, message: "Resource deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCommunityResources = async (req, res) => {
  try {
    const { status = "approved" } = req.query;
    const resources = await Resource.find({ status })
      .sort({ createdAt: -1 })
      .populate("submittedBy", "name")
      .populate("categoryId", "name slug");
    res.json({ success: true, data: { resources } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitCommunityResource = async (req, res) => {
  try {
    const resource = await Resource.create({
      ...req.body,
      status: "pending",
      submittedBy: req.user?._id,
      submitterName: req.body.submitterName || req.user?.name || "Anonymous",
    });
    res.status(201).json({ success: true, data: { resource } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getCommunityResources,
  submitCommunityResource,
};
