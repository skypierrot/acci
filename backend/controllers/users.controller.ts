/**
 * @file controllers/users.controller.ts
 * @description
 *  - 사용자 관리 관련 HTTP 요청을 처리하는 컨트롤러입니다.
 *  - 사용자 CRUD 작업과 권한 관리를 담당합니다.
 */

import { Request, Response } from "express";
import UsersService, { CreateUserData, UpdateUserData } from "../services/users.service";

class UsersController {
  /**
   * 모든 사용자 목록을 조회합니다.
   * GET /api/settings/users
   */
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await UsersService.getAllUsers();
      res.json({
        success: true,
        data: users,
        message: "사용자 목록을 성공적으로 조회했습니다.",
      });
    } catch (error) {
      console.error("사용자 목록 조회 컨트롤러 오류:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "사용자 목록을 조회하는 중 오류가 발생했습니다.",
      });
    }
  }

  /**
   * 특정 사용자 정보를 조회합니다.
   * GET /api/settings/users/:id
   */
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await UsersService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "사용자를 찾을 수 없습니다.",
        });
      }

      res.json({
        success: true,
        data: user,
        message: "사용자 정보를 성공적으로 조회했습니다.",
      });
    } catch (error) {
      console.error("사용자 조회 컨트롤러 오류:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "사용자 정보를 조회하는 중 오류가 발생했습니다.",
      });
    }
  }

  /**
   * 새로운 사용자를 생성합니다.
   * POST /api/settings/users
   */
  async createUser(req: Request, res: Response) {
    try {
      const userData: CreateUserData = req.body;

      // 필수 필드 검증
      if (!userData.username || !userData.email || !userData.password || !userData.fullName) {
        return res.status(400).json({
          success: false,
          error: "사용자명, 이메일, 비밀번호, 실명은 필수 입력 항목입니다.",
        });
      }

      // 사용자명 중복 확인
      const usernameExists = await UsersService.isUsernameExists(userData.username);
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          error: "이미 사용 중인 사용자명입니다.",
        });
      }

      // 이메일 중복 확인
      const emailExists = await UsersService.isEmailExists(userData.email);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: "이미 사용 중인 이메일입니다.",
        });
      }

      const newUser = await UsersService.createUser(userData);
      res.status(201).json({
        success: true,
        data: newUser,
        message: "사용자가 성공적으로 생성되었습니다.",
      });
    } catch (error) {
      console.error("사용자 생성 컨트롤러 오류:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "사용자를 생성하는 중 오류가 발생했습니다.",
      });
    }
  }

  /**
   * 사용자 정보를 수정합니다.
   * PUT /api/settings/users/:id
   */
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userData: UpdateUserData = req.body;

      // 사용자 존재 확인
      const existingUser = await UsersService.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: "수정할 사용자를 찾을 수 없습니다.",
        });
      }

      // 이메일 변경 시 중복 확인
      if (userData.email && userData.email !== existingUser.email) {
        const emailExists = await UsersService.isEmailExists(userData.email);
        if (emailExists) {
          return res.status(400).json({
            success: false,
            error: "이미 사용 중인 이메일입니다.",
          });
        }
      }

      const updatedUser = await UsersService.updateUser(id, userData);
      res.json({
        success: true,
        data: updatedUser,
        message: "사용자 정보가 성공적으로 수정되었습니다.",
      });
    } catch (error) {
      console.error("사용자 수정 컨트롤러 오류:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "사용자 정보를 수정하는 중 오류가 발생했습니다.",
      });
    }
  }

  /**
   * 사용자 비밀번호를 변경합니다.
   * PUT /api/settings/users/:id/password
   */
  async changePassword(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          error: "새 비밀번호는 필수 입력 항목입니다.",
        });
      }

      // 사용자 존재 확인
      const existingUser = await UsersService.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: "사용자를 찾을 수 없습니다.",
        });
      }

      await UsersService.changePassword(id, newPassword);
      res.json({
        success: true,
        message: "비밀번호가 성공적으로 변경되었습니다.",
      });
    } catch (error) {
      console.error("비밀번호 변경 컨트롤러 오류:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "비밀번호를 변경하는 중 오류가 발생했습니다.",
      });
    }
  }

  /**
   * 사용자를 삭제합니다.
   * DELETE /api/settings/users/:id
   */
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // 사용자 존재 확인
      const existingUser = await UsersService.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: "삭제할 사용자를 찾을 수 없습니다.",
        });
      }

      await UsersService.deleteUser(id);
      res.json({
        success: true,
        message: "사용자가 성공적으로 삭제되었습니다.",
      });
    } catch (error) {
      console.error("사용자 삭제 컨트롤러 오류:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "사용자를 삭제하는 중 오류가 발생했습니다.",
      });
    }
  }

  /**
   * 사용자명 중복 확인
   * GET /api/settings/users/check-username/:username
   */
  async checkUsername(req: Request, res: Response) {
    try {
      const { username } = req.params;
      const exists = await UsersService.isUsernameExists(username);
      
      res.json({
        success: true,
        data: { exists },
        message: exists ? "이미 사용 중인 사용자명입니다." : "사용 가능한 사용자명입니다.",
      });
    } catch (error) {
      console.error("사용자명 중복 확인 컨트롤러 오류:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "사용자명 중복을 확인하는 중 오류가 발생했습니다.",
      });
    }
  }

  /**
   * 이메일 중복 확인
   * GET /api/settings/users/check-email/:email
   */
  async checkEmail(req: Request, res: Response) {
    try {
      const { email } = req.params;
      const exists = await UsersService.isEmailExists(email);
      
      res.json({
        success: true,
        data: { exists },
        message: exists ? "이미 사용 중인 이메일입니다." : "사용 가능한 이메일입니다.",
      });
    } catch (error) {
      console.error("이메일 중복 확인 컨트롤러 오류:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "이메일 중복을 확인하는 중 오류가 발생했습니다.",
      });
    }
  }
}

export default new UsersController(); 