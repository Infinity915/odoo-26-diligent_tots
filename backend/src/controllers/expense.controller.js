const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const where = { deletedAt: null };

    const [expenses, total] = await prisma.$transaction([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        include: { vehicle: true }
      }),
      prisma.expense.count({ where })
    ]);

    res.json({
      success: true,
      data: expenses,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: { vehicle: true }
    });
    if (!expense) {
      const error = new Error('Expense not found');
      error.status = 404;
      throw error;
    }
    res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.date) {
      data.date = new Date(data.date);
    }
    
    const expense = await prisma.expense.create({
      data
    });
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.date) {
      data.date = new Date(data.date);
    }

    const expense = await prisma.expense.updateMany({
      where: { id: req.params.id, deletedAt: null },
      data
    });
    
    if (expense.count === 0) {
      const error = new Error('Expense not found or already deleted');
      error.status = 404;
      throw error;
    }

    const updatedExpense = await prisma.expense.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, data: updatedExpense });
  } catch (error) {
    next(error);
  }
};

const softDelete = async (req, res, next) => {
  try {
    const expense = await prisma.expense.updateMany({
      where: { id: req.params.id, deletedAt: null },
      data: { deletedAt: new Date() }
    });

    if (expense.count === 0) {
      const error = new Error('Expense not found or already deleted');
      error.status = 404;
      throw error;
    }
    res.json({ success: true, data: { message: 'Expense successfully deleted' } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, softDelete };
