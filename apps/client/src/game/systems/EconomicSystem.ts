import { EconomySystem, type TerritoryGrid } from '@market-mayhem/shared';
import type { LogicalGrid } from '../entities/LogicalGrid';
export type { EconomicScoreBreakdown } from '@market-mayhem/shared';

/** Keep the scene's constructor stable while sharing every scoring rule with the server. */
export class EconomicSystem extends EconomySystem {
  constructor(grid:TerritoryGrid,_logicalGrid:LogicalGrid){super(grid);}
}
