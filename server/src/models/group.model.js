const { query, getPool } = require('../config/db');
const UserModel = require('./user.model');
const crypto = require('crypto');

// In-memory fallback stores
const memorySchools = [];
const memoryGroups = [];
const memoryGroupMembers = [];
const memoryGroupMessages = [];
let nextSchoolId = 1;
let nextGroupId = 1;
let nextMemberId = 1;
let nextMessageId = 1;

function seedSampleGroups() {
    if (memorySchools.length === 0) {
        const schoolId = nextSchoolId++;
        memorySchools.push({
            id: schoolId,
            name: 'St. Augustine International Academy',
            code: 'SCH-AUG01',
            description: 'Premier science, mathematics and computer engineering department.',
            address: '100 University Boulevard, Tech Park',
            status: 'active',
            created_by: 1,
            created_at: new Date()
        });

        const groupId = nextGroupId++;
        memoryGroups.push({
            id: groupId,
            name: 'CS-401 Advanced Software Architecture',
            code: 'GRP-CS401',
            slug: 'cs-401-advanced-software-architecture',
            description: 'Official academic group for lecture notes, exam schedules and group assessments.',
            school_id: schoolId,
            visibility: 'public',
            created_by: 1,
            created_at: new Date()
        });

        memoryGroupMembers.push({
            id: nextMemberId++,
            group_id: groupId,
            user_id: 1,
            role: 'owner',
            status: 'active',
            joined_at: new Date()
        });

        memoryGroupMessages.push({
            id: nextMessageId++,
            group_id: groupId,
            user_id: 1,
            message: 'Welcome everyone to the CS-401 Group space! Check the Group Exams tab for upcoming assessments.',
            created_at: new Date(Date.now() - 3600000)
        });
    }
}
seedSampleGroups();

class GroupModel {
    static generateGroupCode() {
        return 'GRP-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    }

    static generateSchoolCode() {
        return 'SCH-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    }

    // ==================== SCHOOLS ====================
    static async createSchool({ name, code, description = null, address = null, created_by }) {
        const finalCode = code ? String(code).trim().toUpperCase() : this.generateSchoolCode();
        try {
            const result = await query(`
                INSERT INTO schools (name, code, description, address, status, created_by)
                VALUES (?, ?, ?, ?, 'active', ?)
            `, [name.trim(), finalCode, description, address, created_by]);

            return await this.getSchoolById(result.insertId);
        } catch (dbErr) {
            const school = {
                id: nextSchoolId++,
                name: name.trim(),
                code: finalCode,
                description,
                address,
                status: 'active',
                created_by: Number(created_by),
                created_at: new Date()
            };
            memorySchools.push(school);
            return school;
        }
    }

    static async getSchoolById(id) {
        try {
            const rows = await query('SELECT * FROM schools WHERE id = ?', [id]);
            return rows.length ? rows[0] : null;
        } catch (dbErr) {
            return memorySchools.find(s => s.id === Number(id)) || null;
        }
    }

    static async listSchools() {
        try {
            return await query('SELECT s.*, (SELECT COUNT(*) FROM `groups` g WHERE g.school_id = s.id) AS group_count FROM schools s ORDER BY s.name ASC');
        } catch (dbErr) {
            return memorySchools.map(s => ({
                ...s,
                group_count: memoryGroups.filter(g => g.school_id === s.id).length
            }));
        }
    }

    // ==================== GROUPS ====================
    static async createGroup({ name, description = null, school_id = null, visibility = 'public', created_by }) {
        const code = this.generateGroupCode();
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + crypto.randomBytes(2).toString('hex');

        try {
            const pool = getPool();
            const connection = await pool.getConnection();

            try {
                await connection.beginTransaction();

                const [res] = await connection.query(`
                    INSERT INTO \`groups\` (name, slug, description, school_id, visibility, created_by)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [name.trim(), slug, description, school_id || null, visibility, created_by]);

                const groupId = res.insertId;

                // Add creator as group owner
                await connection.query(`
                    INSERT INTO group_members (group_id, user_id, role, status)
                    VALUES (?, ?, 'owner', 'active')
                `, [groupId, created_by]);

                await connection.commit();
                return await this.getGroupById(groupId);
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (dbErr) {
            const groupId = nextGroupId++;
            const group = {
                id: groupId,
                name: name.trim(),
                code,
                slug,
                description,
                school_id: school_id ? Number(school_id) : null,
                visibility,
                created_by: Number(created_by),
                created_at: new Date()
            };
            memoryGroups.push(group);

            memoryGroupMembers.push({
                id: nextMemberId++,
                group_id: groupId,
                user_id: Number(created_by),
                role: 'owner',
                status: 'active',
                joined_at: new Date()
            });

            return await this.getGroupById(groupId);
        }
    }

    static async getGroupById(id) {
        try {
            const rows = await query(`
                SELECT g.*, s.name AS school_name, s.code AS school_code, u.name AS creator_name,
                       (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'active') AS member_count
                FROM \`groups\` g
                LEFT JOIN schools s ON g.school_id = s.id
                JOIN users u ON g.created_by = u.id
                WHERE g.id = ?
            `, [id]);

            if (!rows.length) return null;
            const group = rows[0];
            if (!group.code) group.code = 'GRP-' + String(group.id).padStart(4, '0');
            return group;
        } catch (dbErr) {
            const group = memoryGroups.find(g => g.id === Number(id));
            if (!group) return null;

            const school = group.school_id ? memorySchools.find(s => s.id === group.school_id) : null;
            const creator = await UserModel.findById(group.created_by);
            const memberCount = memoryGroupMembers.filter(m => m.group_id === group.id && m.status === 'active').length;

            return {
                ...group,
                code: group.code || ('GRP-' + String(group.id).padStart(4, '0')),
                school_name: school?.name || null,
                school_code: school?.code || null,
                creator_name: creator?.name || 'Faculty Leader',
                member_count: memberCount
            };
        }
    }

    static async findGroupByCode(code) {
        const cleanCode = String(code).trim().toUpperCase();
        try {
            const rows = await query(`
                SELECT g.*, s.name AS school_name, u.name AS creator_name,
                       (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'active') AS member_count
                FROM \`groups\` g
                LEFT JOIN schools s ON g.school_id = s.id
                JOIN users u ON g.created_by = u.id
                WHERE g.slug LIKE ? OR g.id = ?
            `, [`%${cleanCode.toLowerCase()}%`, parseInt(cleanCode.replace(/\D/g, '')) || 0]);

            return rows.length ? rows[0] : null;
        } catch (dbErr) {
            const group = memoryGroups.find(g => 
                (g.code && g.code.toUpperCase() === cleanCode) ||
                g.slug.toUpperCase().includes(cleanCode) ||
                ('GRP-' + String(g.id).padStart(4, '0') === cleanCode) ||
                (String(g.id) === cleanCode)
            );
            if (!group) return null;
            return await this.getGroupById(group.id);
        }
    }

    static async listGroups({ userId = null, schoolId = null, search = null }) {
        try {
            let sql = `
                SELECT g.*, s.name AS school_name, u.name AS creator_name,
                       (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'active') AS member_count,
                       (SELECT gm2.role FROM group_members gm2 WHERE gm2.group_id = g.id AND gm2.user_id = ? AND gm2.status = 'active') AS my_role
                FROM \`groups\` g
                LEFT JOIN schools s ON g.school_id = s.id
                JOIN users u ON g.created_by = u.id
                WHERE 1=1
            `;
            const params = [userId || 0];

            if (schoolId) {
                sql += ' AND g.school_id = ?';
                params.push(schoolId);
            }

            if (search) {
                sql += ' AND (g.name LIKE ? OR g.description LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            sql += ' ORDER BY g.created_at DESC';
            const rows = await query(sql, params);
            return rows.map(g => ({
                ...g,
                code: g.code || ('GRP-' + String(g.id).padStart(4, '0'))
            }));
        } catch (dbErr) {
            let list = [...memoryGroups];
            if (schoolId) list = list.filter(g => g.school_id === Number(schoolId));
            if (search) {
                const s = search.toLowerCase();
                list = list.filter(g => g.name.toLowerCase().includes(s) || g.description?.toLowerCase().includes(s));
            }

            return list.map(g => {
                const school = g.school_id ? memorySchools.find(s => s.id === g.school_id) : null;
                const member = userId ? memoryGroupMembers.find(m => m.group_id === g.id && m.user_id === Number(userId) && m.status === 'active') : null;
                const memberCount = memoryGroupMembers.filter(m => m.group_id === g.id && m.status === 'active').length;
                return {
                    ...g,
                    code: g.code || ('GRP-' + String(g.id).padStart(4, '0')),
                    school_name: school?.name || null,
                    creator_name: 'Faculty Member',
                    member_count: memberCount,
                    my_role: member?.role || null
                };
            });
        }
    }

    static async joinGroupByCode(userId, code) {
        const group = await this.findGroupByCode(code);
        if (!group) return { success: false, message: 'Invalid group code. No matching group found.' };

        const numericUserId = Number(userId);
        const user = await UserModel.findById(numericUserId);
        const role = user?.role === 'teacher' ? 'teacher' : 'member';

        try {
            await query(`
                INSERT INTO group_members (group_id, user_id, role, status)
                VALUES (?, ?, ?, 'active')
                ON DUPLICATE KEY UPDATE status = 'active'
            `, [group.id, numericUserId, role]);

            return { success: true, group: await this.getGroupById(group.id), message: `Successfully joined ${group.name}` };
        } catch (dbErr) {
            const existing = memoryGroupMembers.find(m => m.group_id === group.id && m.user_id === numericUserId);
            if (existing) {
                existing.status = 'active';
            } else {
                memoryGroupMembers.push({
                    id: nextMemberId++,
                    group_id: group.id,
                    user_id: numericUserId,
                    role,
                    status: 'active',
                    joined_at: new Date()
                });
            }

            return { success: true, group: await this.getGroupById(group.id), message: `Successfully joined ${group.name}` };
        }
    }

    static async getGroupMembers(groupId) {
        try {
            return await query(`
                SELECT gm.*, u.name, u.email, u.avatar_url, u.role AS user_global_role, u.is_verified_teacher
                FROM group_members gm
                JOIN users u ON gm.user_id = u.id
                WHERE gm.group_id = ? AND gm.status = 'active'
                ORDER BY FIELD(gm.role, 'owner', 'manager', 'teacher', 'member'), gm.joined_at ASC
            `, [groupId]);
        } catch (dbErr) {
            const members = memoryGroupMembers.filter(m => m.group_id === Number(groupId) && m.status === 'active');
            const results = [];
            for (const m of members) {
                const user = await UserModel.findById(m.user_id);
                results.push({
                    ...m,
                    name: user?.name || 'Member',
                    email: user?.email || 'user@examify.org',
                    avatar_url: user?.avatar_url || null,
                    user_global_role: user?.role || 'student',
                    is_verified_teacher: Boolean(user?.is_verified_teacher)
                });
            }
            return results;
        }
    }

    static async leaveGroup(groupId, userId) {
        try {
            await query('DELETE FROM group_members WHERE group_id = ? AND user_id = ? AND role != \'owner\'', [groupId, userId]);
            return true;
        } catch (dbErr) {
            const idx = memoryGroupMembers.findIndex(m => m.group_id === Number(groupId) && m.user_id === Number(userId) && m.role !== 'owner');
            if (idx !== -1) {
                memoryGroupMembers.splice(idx, 1);
                return true;
            }
            return false;
        }
    }

    // ==================== GROUP CHAT / MESSAGES ====================
    static async getGroupMessages(groupId) {
        try {
            const rows = await query(`
                SELECT gm.*, u.name AS user_name, u.email AS user_email, u.avatar_url, u.role AS user_global_role, u.is_verified_teacher,
                       (SELECT gmem.role FROM group_members gmem WHERE gmem.group_id = gm.group_id AND gmem.user_id = gm.user_id AND gmem.status = 'active') AS member_role
                FROM group_messages gm
                JOIN users u ON gm.user_id = u.id
                WHERE gm.group_id = ?
                ORDER BY gm.created_at ASC
            `, [groupId]);
            return rows;
        } catch (dbErr) {
            const messages = memoryGroupMessages.filter(m => m.group_id === Number(groupId));
            const results = [];
            for (const msg of messages) {
                const user = await UserModel.findById(msg.user_id);
                const member = memoryGroupMembers.find(m => m.group_id === Number(groupId) && m.user_id === msg.user_id && m.status === 'active');
                results.push({
                    ...msg,
                    user_name: user?.name || 'Member',
                    user_email: user?.email || 'user@examify.org',
                    avatar_url: user?.avatar_url || null,
                    user_global_role: user?.role || 'student',
                    is_verified_teacher: Boolean(user?.is_verified_teacher),
                    member_role: member?.role || 'member'
                });
            }
            return results;
        }
    }

    static async postGroupMessage({ groupId, userId, message }) {
        const cleanMessage = String(message || '').trim();
        if (!cleanMessage) {
            throw new Error('Message cannot be empty');
        }

        try {
            const result = await query(`
                INSERT INTO group_messages (group_id, user_id, message)
                VALUES (?, ?, ?)
            `, [groupId, userId, cleanMessage]);

            const newMsg = await query(`
                SELECT gm.*, u.name AS user_name, u.email AS user_email, u.avatar_url, u.role AS user_global_role, u.is_verified_teacher,
                       (SELECT gmem.role FROM group_members gmem WHERE gmem.group_id = gm.group_id AND gmem.user_id = gm.user_id AND gmem.status = 'active') AS member_role
                FROM group_messages gm
                JOIN users u ON gm.user_id = u.id
                WHERE gm.id = ?
            `, [result.insertId]);

            return newMsg.length ? newMsg[0] : null;
        } catch (dbErr) {
            const user = await UserModel.findById(userId);
            const member = memoryGroupMembers.find(m => m.group_id === Number(groupId) && m.user_id === Number(userId) && m.status === 'active');
            const newMsg = {
                id: nextMessageId++,
                group_id: Number(groupId),
                user_id: Number(userId),
                message: cleanMessage,
                created_at: new Date(),
                user_name: user?.name || 'Member',
                user_email: user?.email || 'user@examify.org',
                avatar_url: user?.avatar_url || null,
                user_global_role: user?.role || 'student',
                is_verified_teacher: Boolean(user?.is_verified_teacher),
                member_role: member?.role || 'member'
            };
            memoryGroupMessages.push(newMsg);
            return newMsg;
        }
    }

    static async deleteGroupMessage(messageId, userId, isOwnerOrAdmin = false) {
        try {
            if (isOwnerOrAdmin) {
                await query('DELETE FROM group_messages WHERE id = ?', [messageId]);
            } else {
                await query('DELETE FROM group_messages WHERE id = ? AND user_id = ?', [messageId, userId]);
            }
            return true;
        } catch (dbErr) {
            const idx = memoryGroupMessages.findIndex(m => m.id === Number(messageId));
            if (idx !== -1) {
                if (isOwnerOrAdmin || memoryGroupMessages[idx].user_id === Number(userId)) {
                    memoryGroupMessages.splice(idx, 1);
                    return true;
                }
            }
            return false;
        }
    }

    // ==================== GROUP EXAMS ====================
    static async getGroupExams(groupId, userId = null) {
        try {
            const rows = await query(`
                SELECT e.*, u.name AS creator_name,
                       (SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id) AS question_count,
                       (SELECT COUNT(*) FROM exam_attempts ea WHERE ea.exam_id = e.id) AS attempt_count,
                       (SELECT ea2.status FROM exam_attempts ea2 WHERE ea2.exam_id = e.id AND ea2.user_id = ? ORDER BY ea2.id DESC LIMIT 1) AS my_attempt_status,
                       (SELECT ea2.score FROM exam_attempts ea2 WHERE ea2.exam_id = e.id AND ea2.user_id = ? ORDER BY ea2.id DESC LIMIT 1) AS my_last_score,
                       (SELECT ea2.percentage FROM exam_attempts ea2 WHERE ea2.exam_id = e.id AND ea2.user_id = ? ORDER BY ea2.id DESC LIMIT 1) AS my_last_percentage,
                       (SELECT ea2.id FROM exam_attempts ea2 WHERE ea2.exam_id = e.id AND ea2.user_id = ? ORDER BY ea2.id DESC LIMIT 1) AS my_last_attempt_id
                FROM exams e
                JOIN users u ON e.created_by = u.id
                WHERE e.group_id = ?
                ORDER BY e.created_at DESC
            `, [userId || 0, userId || 0, userId || 0, userId || 0, groupId]);

            return rows.map(r => ({
                ...r,
                is_published: Boolean(r.is_published),
                shuffle_questions: Boolean(r.shuffle_questions),
                allow_review: Boolean(r.allow_review)
            }));
        } catch (dbErr) {
            const ExamModel = require('./exam.model');
            const allExams = await ExamModel.listExams({ group_id: Number(groupId) });
            return allExams.filter(e => e.group_id === Number(groupId));
        }
    }

    static clearMemoryStore() {
        memorySchools.length = 0;
        memoryGroups.length = 0;
        memoryGroupMembers.length = 0;
        memoryGroupMessages.length = 0;
        nextSchoolId = 1;
        nextGroupId = 1;
        nextMemberId = 1;
        nextMessageId = 1;
    }
}

module.exports = GroupModel;
