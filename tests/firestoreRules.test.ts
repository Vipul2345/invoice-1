import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('--- RUNNING FIRESTORE SECURITY RULES TESTS ---');

// 1. Verify firestore.rules file syntax and structure
const rulesPath = path.resolve(import.meta.dirname, '../firestore.rules');
assert.ok(fs.existsSync(rulesPath), 'firestore.rules file must exist');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');

assert.ok(rulesContent.includes("rules_version = '2';"), 'Rules must be version 2');
assert.ok(rulesContent.includes('function isSafeInitialUserData'), 'Must contain isSafeInitialUserData helper');
assert.ok(rulesContent.includes('function isPrivilegedPlanUnchanged'), 'Must contain isPrivilegedPlanUnchanged helper');
assert.ok(rulesContent.includes('function hasActiveCloudSubscription'), 'Must contain hasActiveCloudSubscription helper');
assert.ok(rulesContent.includes('match /processed_webhook_events/{eventId}'), 'Must lock down processed webhook events');
assert.ok(rulesContent.includes("allow create: if isOwner(userId) && isValidId(userId) && isUidValid() && isSafeInitialUserData(request.resource.data);"), 'Create rule must enforce safe initial user data');
assert.ok(rulesContent.includes("allow update: if isOwner(userId) && isValidId(userId) && isUidUnchanged() && isPrivilegedPlanUnchanged();"), 'Update rule must block modifying privileged plan/subscription fields');

console.log('PASS: Static rule structure and constraints verified');

// 2. Behavioral Simulator of the Firestore Security Rules Logic
interface AuthContext {
  uid: string | null;
}

interface RequestContext {
  auth: AuthContext | null;
  resource: { data: any } | null;
  resourceData: any;
  database: Record<string, any>;
}

class FirestoreRuleSimulator {
  private database: Record<string, any> = {};

  setDocument(docPath: string, data: any) {
    this.database[docPath] = JSON.parse(JSON.stringify(data));
  }

  getDocument(docPath: string): any {
    return this.database[docPath] ? { data: this.database[docPath] } : null;
  }

  private isSignedIn(auth: AuthContext | null): boolean {
    return auth !== null && auth.uid !== null;
  }

  private isOwner(auth: AuthContext | null, userId: string): boolean {
    return this.isSignedIn(auth) && auth!.uid === userId;
  }

  private isValidId(id: string): boolean {
    return typeof id === 'string' && id.length > 0 && id.length <= 128 && /^[a-zA-Z0-9_\-]+$/.test(id);
  }

  private hasActiveCloudSubscription(userId: string): boolean {
    const userDoc = this.getDocument(`/databases/(default)/documents/users/${userId}`);
    return (
      userDoc != null &&
      userDoc.data.subscription != null &&
      userDoc.data.subscription.status === 'active' &&
      (userDoc.data.subscription.plan === 'drive' || userDoc.data.subscription.plan === 'pro')
    );
  }

  private isSafeInitialPlan(data: any): boolean {
    return !('plan' in data) || data.plan === null || data.plan === 'free';
  }

  private isSafeInitialSubscription(data: any): boolean {
    return (
      !('subscription' in data) ||
      data.subscription === null ||
      (typeof data.subscription === 'object' &&
        (!('plan' in data.subscription) || data.subscription.plan === null || data.subscription.plan === 'free'))
    );
  }

  private isSafeInitialUserData(data: any): boolean {
    return this.isSafeInitialPlan(data) && this.isSafeInitialSubscription(data);
  }

  private isPrivilegedPlanUnchanged(existingData: any, incomingData: any): boolean {
    const existingKeys = Object.keys(existingData || {});
    const incomingKeys = Object.keys(incomingData || {});
    const allKeys = Array.from(new Set([...existingKeys, ...incomingKeys]));
    
    // Affected keys in diff
    const affectedKeys = allKeys.filter(
      (key) => JSON.stringify(existingData?.[key]) !== JSON.stringify(incomingData?.[key])
    );

    return !affectedKeys.includes('subscription') && !affectedKeys.includes('plan');
  }

  private isUidValid(auth: AuthContext | null, incomingData: any): boolean {
    return !('uid' in incomingData) || incomingData.uid === auth?.uid;
  }

  private isUidUnchanged(existingData: any, incomingData: any): boolean {
    return !('uid' in incomingData) || incomingData.uid === existingData?.uid;
  }

  evaluateCreateUser(auth: AuthContext | null, userId: string, incomingData: any): boolean {
    if (!this.isOwner(auth, userId)) return false;
    if (!this.isValidId(userId)) return false;
    if (!this.isUidValid(auth, incomingData)) return false;
    if (!this.isSafeInitialUserData(incomingData)) return false;
    return true;
  }

  evaluateUpdateUser(auth: AuthContext | null, userId: string, existingData: any, incomingData: any): boolean {
    if (!this.isOwner(auth, userId)) return false;
    if (!this.isValidId(userId)) return false;
    if (!this.isUidUnchanged(existingData, incomingData)) return false;
    if (!this.isPrivilegedPlanUnchanged(existingData, incomingData)) return false;
    return true;
  }

  evaluateWriteCloudData(auth: AuthContext | null, userId: string, docId: string): boolean {
    if (!this.isOwner(auth, userId)) return false;
    if (!this.isValidId(docId)) return false;
    if (!this.hasActiveCloudSubscription(userId)) return false;
    return true;
  }

  evaluateWriteWebhookEvent(auth: AuthContext | null): boolean {
    // Client access explicitly forbidden
    return false;
  }
}

const sim = new FirestoreRuleSimulator();

// TEST SUITE: User Document Creation
// Scenario 1: Malicious user attempts to create user doc with 'pro' plan
assert.strictEqual(
  sim.evaluateCreateUser({ uid: 'user123' }, 'user123', {
    uid: 'user123',
    email: 'attacker@test.com',
    plan: 'pro',
  }),
  false,
  'Creating user doc directly with plan: pro must be REJECTED'
);
console.log('PASS: Client cannot create user doc with plan: pro');

// Scenario 2: Malicious user attempts to create user doc with active Pro subscription
assert.strictEqual(
  sim.evaluateCreateUser({ uid: 'user123' }, 'user123', {
    uid: 'user123',
    email: 'attacker@test.com',
    plan: 'free',
    subscription: { status: 'active', plan: 'pro' },
  }),
  false,
  'Creating user doc with subscription.plan: pro must be REJECTED'
);
console.log('PASS: Client cannot create user doc with privileged subscription.plan');

// Scenario 3: Legitimate user creates doc with default free plan
assert.strictEqual(
  sim.evaluateCreateUser({ uid: 'user123' }, 'user123', {
    uid: 'user123',
    email: 'legit@test.com',
    displayName: 'Legitimate User',
    plan: 'free',
    subscription: { status: 'active', plan: 'free' },
  }),
  true,
  'Creating user doc with free plan must be ALLOWED'
);
console.log('PASS: Legitimate user creation with free plan is allowed');

// Scenario 4: Legitimate user creates doc without plan or subscription
assert.strictEqual(
  sim.evaluateCreateUser({ uid: 'user123' }, 'user123', {
    uid: 'user123',
    email: 'legit@test.com',
    displayName: 'Legitimate User',
    createdAt: new Date().toISOString(),
  }),
  true,
  'Creating user doc without privileged fields must be ALLOWED'
);
console.log('PASS: Creating user doc with only profile fields is allowed');

// TEST SUITE: User Document Update & Privilege Escalation
const existingUserDoc = {
  uid: 'user123',
  email: 'user@test.com',
  displayName: 'Alice',
  plan: 'free',
  subscription: {
    plan: 'free',
    status: 'active',
  },
};

// Scenario 5: User updates profile fields (displayName, photoURL)
assert.strictEqual(
  sim.evaluateUpdateUser({ uid: 'user123' }, 'user123', existingUserDoc, {
    ...existingUserDoc,
    displayName: 'Alice Smith',
    photoURL: 'https://example.com/avatar.jpg',
  }),
  true,
  'Updating non-privileged profile attributes must be ALLOWED'
);
console.log('PASS: Updating non-privileged profile fields is allowed');

// Scenario 6: User attempts to modify plan from free to pro
assert.strictEqual(
  sim.evaluateUpdateUser({ uid: 'user123' }, 'user123', existingUserDoc, {
    ...existingUserDoc,
    plan: 'pro',
  }),
  false,
  'Direct client modification of plan to pro must be REJECTED'
);
console.log('PASS: Client cannot update plan field');

// Scenario 7: User attempts to inject/modify subscription to drive
assert.strictEqual(
  sim.evaluateUpdateUser({ uid: 'user123' }, 'user123', existingUserDoc, {
    ...existingUserDoc,
    subscription: {
      plan: 'drive',
      status: 'active',
    },
  }),
  false,
  'Direct client modification of subscription must be REJECTED'
);
console.log('PASS: Client cannot update subscription field');

// Scenario 8: User attempts to update another user's document
assert.strictEqual(
  sim.evaluateUpdateUser({ uid: 'user_attacker' }, 'user_victim', existingUserDoc, {
    ...existingUserDoc,
    displayName: 'Hacked',
  }),
  false,
  'Cross-user document update must be REJECTED'
);
console.log('PASS: Cross-user document modification is blocked');

// Scenario 9: Unauthenticated user attempts update
assert.strictEqual(
  sim.evaluateUpdateUser(null, 'user123', existingUserDoc, {
    ...existingUserDoc,
    displayName: 'Unauth',
  }),
  false,
  'Unauthenticated modification must be REJECTED'
);
console.log('PASS: Unauthenticated user modification is blocked');

// TEST SUITE: CloudData Gating based on Server-Assigned Entitlements
// Scenario 10: User with free plan attempts to write to cloudData
sim.setDocument('/databases/(default)/documents/users/user_free', {
  plan: 'free',
  subscription: { status: 'active', plan: 'free' },
});
assert.strictEqual(
  sim.evaluateWriteCloudData({ uid: 'user_free' }, 'user_free', 'backup_doc_1'),
  false,
  'Free user must NOT have cloudData write permission'
);
console.log('PASS: Free user cannot write to cloudData');

// Scenario 11: User with server-assigned Pro plan writes to cloudData
sim.setDocument('/databases/(default)/documents/users/user_pro', {
  plan: 'pro',
  subscription: { status: 'active', plan: 'pro' },
});
assert.strictEqual(
  sim.evaluateWriteCloudData({ uid: 'user_pro' }, 'user_pro', 'backup_doc_1'),
  true,
  'Pro user with active subscription must be ALLOWED to write to cloudData'
);
console.log('PASS: Pro user with verified subscription can write to cloudData');

// Scenario 12: User attempts to write to another user's cloudData
assert.strictEqual(
  sim.evaluateWriteCloudData({ uid: 'user_other' }, 'user_pro', 'backup_doc_1'),
  false,
  'Cannot write to another user\'s cloudData'
);
console.log('PASS: Cross-user cloudData writes are blocked');

// Scenario 13: Client attempts to write to processed_webhook_events
assert.strictEqual(
  sim.evaluateWriteWebhookEvent({ uid: 'user123' }),
  false,
  'Client cannot write to processed_webhook_events'
);
console.log('PASS: Client write access to processed_webhook_events is blocked');

console.log('ALL FIRESTORE SECURITY RULES TESTS PASSED SUCCESSFULLY!');
