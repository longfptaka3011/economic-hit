export const ECONOMIC_CONSTANTS = {
  // Zone descriptions and economic roles based on Marxist Political Economy
  ZONES: {
    INDUSTRIAL: {
      name: 'Khu Công Nghiệp (Industrial Zone)',
      description: 'Nơi trực tiếp sản xuất Giá trị Thặng dư (m) từ lao động thặng dư.',
      profitType: 'Lợi nhuận Công nghiệp (Industrial Profit)',
      baseSurplusYieldPerCellSec: 3.0, // Base m production per cell per second
    },
    COMMERCIAL: {
      name: 'Khu Thương Nghiệp (Commercial Zone)',
      description: 'Lưu thông hàng hóa, rút ngắn thời gian chu chuyển tư bản.',
      profitType: 'Lợi nhuận Thương nghiệp (Commercial Profit)',
      cashVelocityMultiplier: 1.5, // Multiplies conversion of raw surplus into profit
    },
    FINANCIAL: {
      name: 'Khu Tài Chính (Financial Zone)',
      description: 'Tư bản tiền tệ cho vay thu Lợi tức (Interest) dựa trên quy mô vốn.',
      profitType: 'Lợi tức (Interest)',
      baseInterestRate: 0.04, // 4% compound interest tick on accumulated profit
    },
    LAND: {
      name: 'Khu Đất Đai (Land Zone)',
      description: 'Quyền sở hữu độc quyền ruộng đất thu Địa tô TBCN (Ground Rent).',
      profitType: 'Địa tô TBCN (Ground Rent)',
      rentTollPerOpponentStep: 15, // Penalty deducted from trespassers
    },
    CENTRAL: {
      name: 'Đại Chợ Trung Tâm (Central Market Plaza)',
      description: 'Nơi tập trung giao lưu thương mại và điều tiết thị trường toàn thành phố.',
      profitType: 'Lợi nhuận Giao Thương Trung Tâm',
      baseSurplusYieldPerCellSec: 1.5,
    },
    NEUTRAL: {
      name: 'Khu Vực Chung (Neutral Territory)',
      description: 'Đất tự do chưa quy hoạch phân khu kinh tế chuyên biệt.',
      profitType: 'Lợi nhuận cơ bản',
      baseSurplusYieldPerCellSec: 0.5,
    },
  },

  // Market events schedule throughout the 12-minute match
  MARKET_PHASES: [
    { startSec: 0, endSec: 180, name: 'Tích lũy Sơ khai (Primitive Accumulation)' },
    { startSec: 180, endSec: 360, name: 'Tự do Cạnh tranh (Free Market Competition)' },
    { startSec: 360, endSec: 540, name: 'Khủng hoảng Thừa & Lạm phát (Overproduction & Inflation)' },
    { startSec: 540, endSec: 720, name: 'Độc quyền & Tranh giành Thị trường (Monopoly Endgame)' },
  ],
} as const;

