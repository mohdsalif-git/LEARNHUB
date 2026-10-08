import Category from "../models/Category.js";
import Resource from "../models/Resource.js";

/**
 * Fetch all active categories and inject a live courseCount for each,
 * computed by counting approved Resources whose categoryId matches, falling
 * back to matching by the category slug/name string stored in Resource.category.
 *
 * Aggregation strategy:
 *   1. Run a $group on the Resource collection filtered to status:"approved",
 *      grouped by categoryId (ObjectId ref) → gives counts for resources that
 *      were submitted with the new categoryId field.
 *   2. Also group by the legacy string field Resource.category (slug/name) for
 *      resources that pre-date the categoryId migration.
 *   3. Merge both maps, preferring the categoryId count when both exist.
 *   4. Attach the computed count to each Category document; never use the
 *      stale Category.courseCount stored field.
 */
const getCategories = async (req, res) => {
  try {
    const { type, status } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    else query.status = "active";

    // Fetch matching categories
    const categories = await Category.find(query).sort({ displayOrder: 1, name: 1 });

    if (categories.length === 0) {
      return res.json({ success: true, data: { categories: [] } });
    }

    // Build live count maps in parallel
    const [byIdAgg, bySlugAgg] = await Promise.all([
      // Count by categoryId (ObjectId) — only works for resources that have been
      // linked to a Category document via the categoryId field.
      Resource.aggregate([
        { $match: { status: "approved", categoryId: { $exists: true, $ne: null } } },
        { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      ]),
      // Count by the legacy string field Resource.category (slug/name).
      Resource.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);

    // Map: categoryId (string) → count
    const countById = {};
    for (const { _id, count } of byIdAgg) {
      if (_id) countById[_id.toString()] = count;
    }

    // Map: category string (slug or name) → count
    const countBySlug = {};
    for (const { _id, count } of bySlugAgg) {
      if (_id) countBySlug[_id.toLowerCase()] = count;
    }

    // Attach live courseCount to each category
    const enriched = categories.map((cat) => {
      const obj = cat.toObject();
      const idKey = obj._id.toString();
      // Prefer the categoryId-based count (most accurate), fall back to slug/name match
      const idCount = countById[idKey] ?? 0;
      const slugCount =
        countBySlug[obj.slug?.toLowerCase()] ??
        countBySlug[obj.name?.toLowerCase()] ??
        0;
      obj.courseCount = idCount + slugCount;
      return obj;
    });

    res.json({ success: true, data: { categories: enriched } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Attach live count to single-category response too
    const count = await Resource.countDocuments({
      status: "approved",
      $or: [
        { categoryId: category._id },
        { category: { $regex: `^${category.slug}$`, $options: "i" } },
        { category: { $regex: `^${category.name}$`, $options: "i" } },
      ],
    });

    const obj = category.toObject();
    obj.courseCount = count;

    res.json({ success: true, data: { category: obj } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: { category } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, data: { category } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const bulkImportCategories = async (req, res) => {
  try {
    const { categories } = req.body;
    if (!Array.isArray(categories)) {
      return res.status(400).json({ success: false, message: "Categories must be an array" });
    }
    // BUG #6 FIX: Mongoose BulkWriteError exposes result.insertedCount, not insertedDocs.
    // ordered:false allows partial inserts; we count what was actually inserted.
    let importedCount = 0;
    try {
      const results = await Category.insertMany(categories, { ordered: false });
      importedCount = results.length;
    } catch (bulkErr) {
      // BulkWriteError: some docs may have been inserted before the error
      importedCount = bulkErr.result?.nInserted ?? bulkErr.insertedDocs?.length ?? 0;
    }
    res.json({ success: true, data: { imported: importedCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory, bulkImportCategories };
