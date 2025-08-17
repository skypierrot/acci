/**
 * @file services/users.service.ts
 * @description
 *  - 사용자 관리 관련 비즈니스 로직을 처리하는 서비스 클래스입니다.
 *  - 사용자 CRUD 작업과 권한 관리를 담당합니다.
 */

import { db, tables } from "../orm";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcrypt";
import { users } from "../orm/schema/users";

// 사용자 타입 정의
export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  department?: string;
  position?: string;
  phone?: string;
  role?: "admin" | "manager" | "user";
  status?: "active" | "inactive" | "suspended";
  notes?: string;
}

export interface UpdateUserData {
  email?: string;
  fullName?: string;
  department?: string;
  position?: string;
  phone?: string;
  role?: "admin" | "manager" | "user";
  status?: "active" | "inactive" | "suspended";
  notes?: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  fullName: string;
  department?: string;
  position?: string;
  phone?: string;
  role: "admin" | "manager" | "user";
  status: "active" | "inactive" | "suspended";
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

class UsersService {
  /**
   * 모든 사용자 목록을 조회합니다.
   */
  async getAllUsers(): Promise<UserResponse[]> {
    try {
      console.log("tables.users:", tables.users);
      console.log("tables:", Object.keys(tables));
      
      const userList = await db()
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          fullName: users.fullName,
          department: users.department,
          position: users.position,
          phone: users.phone,
          role: users.role,
          status: users.status,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          notes: users.notes,
        })
        .from(users)
        .orderBy(desc(users.createdAt));

      return userList;
    } catch (error) {
      console.error("사용자 목록 조회 오류:", error);
      throw new Error("사용자 목록을 조회하는 중 오류가 발생했습니다.");
    }
  }

  /**
   * 특정 사용자 정보를 조회합니다.
   */
  async getUserById(id: string): Promise<UserResponse | null> {
    try {
      const user = await db()
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          fullName: users.fullName,
          department: users.department,
          position: users.position,
          phone: users.phone,
          role: users.role,
          status: users.status,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          notes: users.notes,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return user[0] || null;
    } catch (error) {
      console.error("사용자 조회 오류:", error);
      throw new Error("사용자 정보를 조회하는 중 오류가 발생했습니다.");
    }
  }

  /**
   * 사용자명으로 사용자를 조회합니다.
   */
  async getUserByUsername(username: string): Promise<UserResponse | null> {
    try {
      const user = await db()
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          fullName: users.fullName,
          department: users.department,
          position: users.position,
          phone: users.phone,
          role: users.role,
          status: users.status,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          notes: users.notes,
        })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      return user[0] || null;
    } catch (error) {
      console.error("사용자명으로 조회 오류:", error);
      throw new Error("사용자 정보를 조회하는 중 오류가 발생했습니다.");
    }
  }

  /**
   * 새로운 사용자를 생성합니다.
   */
  async createUser(userData: CreateUserData): Promise<UserResponse> {
    try {
      // 비밀번호 해시화
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const [newUser] = await db()
        .insert(users)
        .values({
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          fullName: userData.fullName,
          department: userData.department,
          position: userData.position,
          phone: userData.phone,
          role: userData.role || "user",
          status: userData.status || "active",
          notes: userData.notes,
        })
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          fullName: users.fullName,
          department: users.department,
          position: users.position,
          phone: users.phone,
          role: users.role,
          status: users.status,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          notes: users.notes,
        });

      return newUser;
    } catch (error) {
      console.error("사용자 생성 오류:", error);
      throw new Error("사용자를 생성하는 중 오류가 발생했습니다.");
    }
  }

  /**
   * 사용자 정보를 수정합니다.
   */
  async updateUser(id: string, userData: UpdateUserData): Promise<UserResponse | null> {
    try {
      const [updatedUser] = await db()
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          fullName: users.fullName,
          department: users.department,
          position: users.position,
          phone: users.phone,
          role: users.role,
          status: users.status,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          notes: users.notes,
        });

      return updatedUser || null;
    } catch (error) {
      console.error("사용자 수정 오류:", error);
      throw new Error("사용자 정보를 수정하는 중 오류가 발생했습니다.");
    }
  }

  /**
   * 사용자 비밀번호를 변경합니다.
   */
  async changePassword(id: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const result = await db()
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));

      return true;
    } catch (error) {
      console.error("비밀번호 변경 오류:", error);
      throw new Error("비밀번호를 변경하는 중 오류가 발생했습니다.");
    }
  }

  /**
   * 사용자를 삭제합니다.
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      await db()
        .delete(users)
        .where(eq(users.id, id));

      return true;
    } catch (error) {
      console.error("사용자 삭제 오류:", error);
      throw new Error("사용자를 삭제하는 중 오류가 발생했습니다.");
    }
  }

  /**
   * 사용자 로그인 시간을 업데이트합니다.
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      await db()
        .update(users)
        .set({
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));
    } catch (error) {
      console.error("로그인 시간 업데이트 오류:", error);
    }
  }

  /**
   * 사용자명 중복 확인
   */
  async isUsernameExists(username: string): Promise<boolean> {
    try {
      const user = await db()
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      return user.length > 0;
    } catch (error) {
      console.error("사용자명 중복 확인 오류:", error);
      throw new Error("사용자명 중복을 확인하는 중 오류가 발생했습니다.");
    }
  }

  /**
   * 이메일 중복 확인
   */
  async isEmailExists(email: string): Promise<boolean> {
    try {
      const user = await db()
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return user.length > 0;
    } catch (error) {
      console.error("이메일 중복 확인 오류:", error);
      throw new Error("이메일 중복을 확인하는 중 오류가 발생했습니다.");
    }
  }
}

export default new UsersService(); 