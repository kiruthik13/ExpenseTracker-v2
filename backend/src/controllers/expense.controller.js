import ExpenseService from '../services/expense.service.js';
import { successResponse } from '../utils/response.util.js';
import AppError from '../exceptions/AppError.js';

class ExpenseController {
  async getAll(req, res, next) {
    try {
      const result = await ExpenseService.getAll(req.user._id, req.query);
      return successResponse(res, 'Expenses retrieved', result.docs, 200, {
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page,
        limit: result.limit,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const expense = await ExpenseService.getById(req.user._id, req.params.id);
      return successResponse(res, 'Expense retrieved', expense);
    } catch (error) {
      next(error);
    }
  }

  async search(req, res, next) {
    try {
      const { q, ...queryParams } = req.query;
      const result = await ExpenseService.search(req.user._id, q, queryParams);
      return successResponse(res, 'Search results', result.docs, 200, {
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page,
        limit: result.limit,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const expense = await ExpenseService.create(req.user._id, req.body);
      return successResponse(res, 'Expense created', expense, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const expense = await ExpenseService.update(req.user._id, req.params.id, req.body);
      return successResponse(res, 'Expense updated', expense);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await ExpenseService.delete(req.user._id, req.params.id);
      return successResponse(res, 'Expense deleted', null);
    } catch (error) {
      next(error);
    }
  }

  async uploadReceipt(req, res, next) {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);
      const expense = await ExpenseService.uploadReceipt(req.user._id, req.params.id, req.file);
      return successResponse(res, 'Receipt uploaded', expense);
    } catch (error) {
      next(error);
    }
  }

  async exportCSV(req, res, next) {
    try {
      const { headers, rows, count } = await ExpenseService.exportCSV(req.user._id, req.query);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="expenses_${Date.now()}.csv"`);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

      return res.send(csvContent);
    } catch (error) {
      next(error);
    }
  }

  async exportPDF(req, res, next) {
    try {
      const expenses = await ExpenseService.exportPDFData(req.user._id, req.query);

      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="expenses_${Date.now()}.pdf"`);

      doc.pipe(res);

      // PDF Header
      doc.fontSize(22).font('Helvetica-Bold').text('Expense Report', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1.5);

      // Table headers
      const cols = { date: 50, type: 140, category: 210, amount: 320, description: 390 };
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Date', cols.date, doc.y, { continued: true });
      doc.text('Type', cols.type, doc.y, { continued: true });
      doc.text('Category', cols.category, doc.y, { continued: true });
      doc.text('Amount', cols.amount, doc.y, { continued: true });
      doc.text('Description', cols.description, doc.y);
      doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
      doc.moveDown(0.5);

      // Table rows
      doc.font('Helvetica').fontSize(9);
      expenses.forEach((e) => {
        if (doc.y > 700) { doc.addPage(); }
        const y = doc.y;
        doc.text(new Date(e.date).toLocaleDateString(), cols.date, y, { continued: true });
        doc.text(e.type, cols.type, y, { continued: true });
        doc.text(e.categoryId?.name || '-', cols.category, y, { continued: true });
        doc.text(`${e.amount.toFixed(2)}`, cols.amount, y, { continued: true });
        doc.text((e.description || '-').substring(0, 30), cols.description, y);
        doc.moveDown(0.4);
      });

      doc.end();
    } catch (error) {
      next(error);
    }
  }
}

export default new ExpenseController();
