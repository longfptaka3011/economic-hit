export const ECONOMIC_CONSTANTS = {
  // Zone descriptions and economic roles based on Marxist Political Economy
  ZONES: {
    INDUSTRIAL: {
      name: 'Khu Công Nghiệp (Industrial Zone)',
      description: 'Nơi trực tiếp sản xuất Giá trị Thặng dư (m) từ lao động thặng dư.',
      profitType: 'Lợi nhuận Công nghiệp (Industrial Profit)',
      baseSurplusYieldPerCellSec: 2.0, // Balanced gameplay yield, not a textbook quantity
    },
    COMMERCIAL: {
      name: 'Khu Thương Nghiệp (Commercial Zone)',
      description: 'Lưu thông hàng hóa, rút ngắn thời gian chu chuyển tư bản.',
      profitType: 'Lợi nhuận Thương nghiệp (Commercial Profit)',
      baseSurplusYieldPerCellSec: 2.0,
    },
    FINANCIAL: {
      name: 'Khu Tài Chính (Financial Zone)',
      description: 'Tư bản tiền tệ cho vay thu Lợi tức (Interest) dựa trên quy mô vốn.',
      profitType: 'Lợi tức (Interest)',
      baseSurplusYieldPerCellSec: 2.0,
      interestPeriodSeconds: 2.5, // Fixed cell yield, never compounded score
    },
    LAND: {
      name: 'Khu Đất Đai (Land Zone)',
      description: 'Quyền sở hữu độc quyền ruộng đất thu Địa tô TBCN (Ground Rent).',
      profitType: 'Địa tô TBCN (Ground Rent)',
      baseSurplusYieldPerCellSec: 2.0,
      rentTollPerOpponentStep: 5,
    },
    CENTRAL: {
      name: 'Đại Chợ Trung Tâm (Central Market Plaza)',
      description: 'Nơi tập trung giao lưu thương mại và điều tiết thị trường toàn thành phố.',
      profitType: 'Lợi nhuận Giao Thương Trung Tâm',
      baseSurplusYieldPerCellSec: 3.0,
    },
    NEUTRAL: {
      name: 'Khu Vực Chung (Neutral Territory)',
      description: 'Đất tự do chưa quy hoạch phân khu kinh tế chuyên biệt.',
      profitType: 'Lợi nhuận cơ bản',
      baseSurplusYieldPerCellSec: 0.5,
    },
  },

  // Narrative phases of the 8-minute match; these do not modify live income.
  MARKET_PHASES: [
    { startSec: 0, endSec: 120, name: 'Tích lũy Sơ khai (Primitive Accumulation)' },
    { startSec: 120, endSec: 240, name: 'Tự do Cạnh tranh (Free Market Competition)' },
    { startSec: 240, endSec: 360, name: 'Khủng hoảng Thừa & Lạm phát (Overproduction & Inflation)' },
    { startSec: 360, endSec: 480, name: 'Độc quyền & Tranh giành Thị trường (Monopoly Endgame)' },
  ],
} as const;

