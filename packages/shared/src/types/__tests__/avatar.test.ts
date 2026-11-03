import { describe, expect, it } from 'vitest';
import { parseAvatarProfile, AVATAR_COLORS, CHARACTER_COUNT } from '../avatar.types.js';
import { GAME_CONSTANTS } from '../../constants/game.constants.js';
import { LEARNING_STAGES } from '../../learning/QuizDirector.js';

describe('Player setup',()=>{
  it('requires a trimmed name and a valid character/palette choice',()=>{
    expect(parseAvatarProfile({nickname:'  Linh  ',character:5,color:AVATAR_COLORS[7]})).toEqual({nickname:'Linh',character:5,color:AVATAR_COLORS[7]});
    for(const nickname of ['', ' ', 'A', 'x'.repeat(25), 12])expect(parseAvatarProfile({nickname,character:0,color:AVATAR_COLORS[0]})).toBeNull();
    for(const character of [-1,CHARACTER_COUNT,.5,'1',NaN])expect(parseAvatarProfile({nickname:'An',character,color:AVATAR_COLORS[0]})).toBeNull();
    expect(parseAvatarProfile({nickname:'An',character:0,color:0})).toBeNull();
    expect(parseAvatarProfile(null)).toBeNull();
    expect(parseAvatarProfile('An')).toBeNull();
  });
  it('uses eight minutes for both modes and fits all five learning stages before the end',()=>{
    expect(GAME_CONSTANTS.MATCH_DURATION_SECONDS).toBe(480);
    expect(LEARNING_STAGES.map(s=>s.atSeconds)).toEqual([60,150,240,330,420]);
    expect(LEARNING_STAGES.every(s=>s.atSeconds<GAME_CONSTANTS.MATCH_DURATION_SECONDS)).toBe(true);
  });
});
