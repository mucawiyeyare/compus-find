import { Server, Socket } from 'socket.io';
import Message from '../models/Message';

export const handleSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket Client Connected: ${socket.id}`);

    // Join room for direct chat or study group
    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Handle sending message
    socket.on('send_message', async (data: {
      sender: string;
      receiver?: string;
      studyGroup?: string;
      content: string;
      fileUrl?: string;
      fileType?: string;
      roomId: string;
    }) => {
      try {
        const message = await Message.create({
          sender: data.sender,
          receiver: data.receiver,
          studyGroup: data.studyGroup,
          content: data.content,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          readBy: [data.sender as any]
        });

        const populatedMessage = await message.populate('sender', 'name avatar');
        
        // Broadcast to specific room
        io.to(data.roomId).emit('receive_message', populatedMessage);
      } catch (error) {
        console.error('Socket send message error:', error);
      }
    });

    // Handle typing events
    socket.on('typing', (data: { roomId: string; username: string; isTyping: boolean }) => {
      socket.to(data.roomId).emit('typing_status', data);
    });

    socket.on('disconnect', () => {
      console.log(`Socket Client Disconnected: ${socket.id}`);
    });
  });
};
