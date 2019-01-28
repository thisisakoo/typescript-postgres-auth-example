import { getRepository, Repository } from "typeorm";
import AuthPermission from '../../interfaces/permission.interface';
import Dao from '../../interfaces/dao.interface';
import RecordNotFoundException from '../../exceptions/RecordNotFoundException';
import RecordsNotFoundException from '../../exceptions/RecordsNotFoundException';
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import { methodActions, getPermission } from "../../utils/authorization.helper";

import { User } from "./user.entity";
import CreateUserDto from "./user.dto";

/**
 * Handles CRUD operations on User data in database
 * Factoring to this class allows other (i.e. GraphQL to reuse this code in resolvers)
 */
class UserDao implements Dao {
  private resource: string = "user"; // matches defined user user 'resource'
  private userRepository: Repository<User> = getRepository(User);

  constructor() {
  }

  public getAll = async (user: User, params?: {[key: string]: any}): 
            Promise<User[] | RecordsNotFoundException | UserNotAuthorizedException> => {
    const records = await this.userRepository.find({ relations: ["roles"] });
    
    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.GET;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (!records) {
        throw new RecordsNotFoundException(this.resource);
      } else {
        return permission.filter(records);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public getOne = async (user: User, id: string | number): 
            Promise<User | RecordNotFoundException | UserNotAuthorizedException> => {
    const record = await this.userRepository.findOne(id, { relations: ["roles"] });

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.GET;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (!record) {
        throw new RecordNotFoundException(id);
      } else {
        return permission.filter(record);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public save = async (user: User, data: any): 
            Promise<User | RecordNotFoundException | UserNotAuthorizedException> => {
    const newRecord: CreateUserDto = data;

    const isOwnerOrMember: boolean = (data.id && user.id === data.id);
    const action: string = data.id ? methodActions.PUT : methodActions.POST;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const filteredData: User = permission.filter(newRecord);
      await this.userRepository.save(filteredData);
      return filteredData;
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public remove = async (user: User, id: string | number): 
            Promise<boolean | RecordNotFoundException | UserNotAuthorizedException> => {
    const recordToRemove = await this.userRepository.findOne(id);

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (recordToRemove) {
        await this.userRepository.remove(recordToRemove);
        return true;
      } else {
        throw new RecordNotFoundException(id);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

}

export default UserDao;