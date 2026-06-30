import ExpenseRepository from '../repositories/Expense.repository.js';
import BudgetRepository from '../repositories/Budget.repository.js';
import CategoryRepository from '../repositories/Category.repository.js';
import UserRepository from '../repositories/User.repository.js';
import SavingsGoalRepository from '../repositories/SavingsGoal.repository.js';
import User from '../models/User.js';

class PremiumService {
  async getFinancialHealthScore(userId) {
    const user = await User.findById(userId);
    if (!user) return 0;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 1. Calculate Saving Rate (40 points)
    const expenses = await ExpenseRepository.findByUserId(userId);
    const thisMonthTxns = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear && !e.isDeleted;
    });

    const income = thisMonthTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const spent = thisMonthTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    let savingRateScore = 0;
    if (income > 0) {
      const savingRate = (income - spent) / income;
      if (savingRate >= 0.3) {
        savingRateScore = 40;
      } else if (savingRate > 0) {
        savingRateScore = Math.round((savingRate / 0.3) * 40);
      }
    } else if (spent === 0) {
      savingRateScore = 40; // No transactions is neutral/good
    }

    // 2. Budget Adherence (40 points)
    const budgets = await BudgetRepository.findByUserId(userId, currentMonth, currentYear);
    let budgetScore = 40;
    if (budgets.length > 0) {
      const exceeded = budgets.filter(b => b.spentAmount > b.budgetAmount).length;
      budgetScore = Math.round(((budgets.length - exceeded) / budgets.length) * 40);
    }

    // 3. Daily Streak Consistency (20 points)
    const streak = user.streakCount || 0;
    const streakScore = Math.min(streak * 2, 20); // 2 points per streak day, max 20 points

    const totalScore = savingRateScore + budgetScore + streakScore;
    return Math.min(Math.max(totalScore, 0), 100);
  }

  async getExpensePrediction(userId) {
    const expenses = await ExpenseRepository.findByUserId(userId);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get current month's expenses
    const thisMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear && tIsExpense(e);
    });

    const totalSpentThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Calculate daily average
    const dailyAverage = dayOfMonth > 0 ? totalSpentThisMonth / dayOfMonth : 0;
    const remainingDays = daysInMonth - dayOfMonth;

    // Projected end of month spending
    const projectedSpent = totalSpentThisMonth + (dailyAverage * remainingDays);
    return {
      currentSpent: totalSpentThisMonth,
      projectedSpent: Math.round(projectedSpent),
      dailyAverage: Math.round(dailyAverage * 100) / 100,
      daysRemaining: remainingDays
    };
  }

  async getAISpendingInsights(userId) {
    const expenses = await ExpenseRepository.findByUserId(userId);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const thisMonthTxns = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear && !e.isDeleted;
    });

    const totalIncome = thisMonthTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = thisMonthTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const insights = [];

    // Rule 1: High Spending Ratio
    if (totalIncome > 0 && totalSpent / totalIncome > 0.85) {
      insights.push({
        type: 'warning',
        title: 'High Spending Detected',
        message: `You've spent ${Math.round((totalSpent / totalIncome) * 100)}% of your monthly income. We recommend pausing non-essential purchases.`
      });
    }

    // Rule 2: Low Net Balance
    const remaining = totalIncome - totalSpent;
    if (totalIncome > 0 && remaining > 0 && remaining < totalIncome * 0.1) {
      insights.push({
        type: 'danger',
        title: 'Low Balance Alert',
        message: `Your net savings are critically low (${formatCurrencyShort(remaining)} left). Consider scaling back on dining out or shopping.`
      });
    }

    // Rule 3: Category Spike (comparison to past month)
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const lastMonthTxns = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === lastMonth && d.getFullYear() === lastMonthYear && tIsExpense(e);
    });

    const categorySumsThisMonth = getCategorySums(thisMonthTxns.filter(tIsExpense));
    const categorySumsLastMonth = getCategorySums(lastMonthTxns);

    let maxSpikeCat = null;
    let maxSpikeAmount = 0;

    for (const [catId, sumThis] of Object.entries(categorySumsThisMonth)) {
      const sumLast = categorySumsLastMonth[catId] || 0;
      if (sumThis > sumLast * 1.3 && sumThis - sumLast > 1000) { // 30% increase and at least ₹1000 diff
        const diff = sumThis - sumLast;
        if (diff > maxSpikeAmount) {
          maxSpikeAmount = diff;
          maxSpikeCat = thisMonthTxns.find(t => t.categoryId?._id?.toString() === catId)?.categoryId?.name || 'Unknown';
        }
      }
    }

    if (maxSpikeCat) {
      insights.push({
        type: 'info',
        title: `${maxSpikeCat} Spending Spike`,
        message: `You spent ${formatCurrencyShort(maxSpikeAmount)} more on ${maxSpikeCat} compared to last month. Cooking at home or setting a stricter limit might help.`
      });
    }

    // Rule 4: Savings Goal Motivation
    const activeGoals = await SavingsGoalRepository.findActiveByUserId(userId);
    if (activeGoals.length > 0 && remaining > 1000) {
      const targetGoal = activeGoals[0];
      insights.push({
        type: 'success',
        title: `Reach Your Goal: ${targetGoal.title}`,
        message: `You have ${formatCurrencyShort(remaining)} in unallocated savings. Depositing ₹1,000 of this could help you reach your "${targetGoal.title}" target sooner!`
      });
    }

    // Default insight if empty
    if (insights.length === 0) {
      insights.push({
        type: 'success',
        title: 'Budget On Track',
        message: 'Your spending habits are balanced this month. Keep maintaining this pace!'
      });
    }

    return insights;
  }

  async getSmartBudgetRecommendation(userId) {
    const expenses = await ExpenseRepository.findByUserId(userId);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get past 3 months' expenses (excluding current month)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const pastExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      const isPastMonth = (d.getFullYear() < currentYear) || (d.getFullYear() === currentYear && d.getMonth() + 1 < currentMonth);
      return d >= threeMonthsAgo && isPastMonth && tIsExpense(e);
    });

    const categorySums = getCategorySums(pastExpenses);
    const recommendations = [];

    // Group expenses by category
    const categories = await CategoryRepository.findByUserId(userId);
    const expenseCategories = categories.filter(c => c.type !== 'income');

    for (const cat of expenseCategories) {
      const totalSpent = categorySums[cat._id.toString()] || 0;
      const averageMonthly = totalSpent / 3;
      
      // Recommendation is average plus 10% safety buffer, rounded to nearest 10
      const recommendedAmount = Math.max(50, Math.round((averageMonthly * 1.1) / 10) * 10);

      recommendations.push({
        categoryId: cat._id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        averageSpending: Math.round(averageMonthly),
        recommendedBudget: recommendedAmount
      });
    }

    return recommendations;
  }
}

// Helpers
function tIsExpense(t) {
  return t.type === 'expense' && !t.isDeleted;
}

function getCategorySums(txns) {
  const sums = {};
  txns.forEach(t => {
    if (t.categoryId) {
      const idStr = t.categoryId._id?.toString() || t.categoryId.toString();
      sums[idStr] = (sums[idStr] || 0) + t.amount;
    }
  });
  return sums;
}

function formatCurrencyShort(amount) {
  return `₹${Math.round(amount)}`;
}

export default new PremiumService();
