import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) {
    throw badRequest('Activity details are required');
  }

  const { userId, teamId, type, minutes } = input;
  if (
    typeof userId !== 'string' ||
    !/^[\da-f]{24}$/i.test(userId) ||
    typeof teamId !== 'string' ||
    !/^[\da-f]{24}$/i.test(teamId) ||
    typeof type !== 'string' ||
    type.trim().length === 0 ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw badRequest('Valid userId, teamId, type, and positive minutes are required');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user) throw notFound('User not found');
  if (!team) throw notFound('Team not found');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw badRequest('Team details are required');

  const { name, mascot, members = [] } = input;
  if (
    typeof name !== 'string' ||
    name.trim().length === 0 ||
    typeof mascot !== 'string' ||
    mascot.trim().length === 0 ||
    !Array.isArray(members) ||
    members.some((member) => typeof member !== 'string' || !/^[\da-f]{24}$/i.test(member))
  ) {
    throw badRequest('Valid name, mascot, and member IDs are required');
  }

  const memberIds = members as string[];
  const users = memberIds.length > 0 ? await User.find({ _id: { $in: memberIds } }).select('_id').lean() : [];
  if (users.length !== new Set(memberIds).size) throw notFound('One or more team members were not found');

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: import('mongoose').Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw notFound('User not found');

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const latestActivity = activities[0];
  const activityFocus: Record<string, string> = {
    run: 'endurance',
    walk: 'endurance',
    cycle: 'endurance',
    bike: 'endurance',
    swim: 'endurance',
    strength: 'strength',
    yoga: 'mobility',
    mobility: 'mobility',
  };
  const focus = (latestActivity && activityFocus[latestActivity.type.toLowerCase()]) || user.fitnessGoal;
  const activityDescription = latestActivity ? `${latestActivity.type} activity` : `${user.fitnessGoal} goal`;

  return workouts
    .map((workout) => ({
      ...workout,
      reason: workout.focus.toLowerCase() === focus.toLowerCase()
        ? `Recommended for your ${user.fitnessGoal} goal and ${activityDescription}.`
        : `Suggested workout for your ${user.fitnessGoal} goal.`,
      relevance: workout.focus.toLowerCase() === focus.toLowerCase() ? 1 : 0,
    }))
    .sort((left, right) => right.relevance - left.relevance || left.title.localeCompare(right.title))
    .map(({ relevance: _relevance, ...workout }) => workout);
}

export { User };
